-- Hosted Supabase keeps pgcrypto in the extensions schema. record_click used
-- SET search_path TO public, so gen_random_bytes was not visible.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.record_click(
  p_offer_slug text,
  p_ref_slug text,
  p_origin text default null,
  p_user_agent text default null,
  p_referer text default null,
  p_ip_hash text default null,
  p_country text default null,
  p_device text default null,
  p_sub1 text default null,
  p_sub2 text default null,
  p_sub3 text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  offer public.offers;
  promoter public.profiles;
  settings public.program_settings;
  new_click text;
  dest text;
  velocity int;
  flagged boolean := false;
  click_count int;
  commission numeric := 0;
begin
  select * into settings from public.program_settings where id = 1;
  select * into offer from public.offers where slug = lower(trim(p_offer_slug)) and is_active = true;
  if offer.id is null then
    raise exception 'Unknown or inactive offer' using errcode = 'P0002';
  end if;

  select * into promoter
  from public.profiles p
  where lower(p.referral_slug) = lower(trim(p_ref_slug))
     or lower(p.username) = lower(trim(p_ref_slug))
  order by case when lower(p.referral_slug) = lower(trim(p_ref_slug)) then 0 else 1 end
  limit 1;
  if promoter.id is null then
    raise exception 'Unknown promoter' using errcode = 'P0002';
  end if;
  if promoter.status <> 'active' then
    raise exception 'Promoter is not active' using errcode = '42501';
  end if;

  if offer.requires_approval and not exists (
    select 1 from public.offer_access a where a.offer_id = offer.id and a.profile_id = promoter.id
  ) then
    raise exception 'Offer is not available to this promoter' using errcode = '42501';
  end if;

  if offer.click_cap is not null then
    select count(*) into click_count from public.clicks where offer_id = offer.id;
    if click_count >= offer.click_cap then
      raise exception 'Offer click cap reached' using errcode = 'P0001';
    end if;
  end if;

  if coalesce(p_ip_hash,'') <> '' then
    select count(*) into velocity from public.clicks
    where ip_hash = p_ip_hash and created_at > now() - interval '60 seconds';
    if velocity >= coalesce(settings.click_velocity_limit, 40) then
      flagged := true;
    end if;
  end if;

  new_click := encode(extensions.gen_random_bytes(16), 'hex');
  dest := public.build_offer_destination(offer, trim(p_ref_slug), new_click, p_origin, p_sub1, p_sub2, p_sub3);

  insert into public.clicks (click_id, offer_id, promoter_id, landing_url, user_agent, referer, ip_hash, country, device, sub1, sub2, sub3, flagged)
  values (new_click, offer.id, promoter.id, dest, left(coalesce(p_user_agent,''),400), left(coalesce(p_referer,''),500), p_ip_hash, p_country, p_device, p_sub1, p_sub2, p_sub3, flagged);

  if flagged then
    insert into public.fraud_events (click_id, promoter_id, offer_id, reason, detail)
    values (new_click, promoter.id, offer.id, 'click_velocity', jsonb_build_object('ip_hash', p_ip_hash, 'window_clicks', velocity + 1));
  end if;

  if offer.payout_model = 'cpc' and not flagged then
    commission := public.compute_commission(offer, 0);
    insert into public.conversions (offer_id, promoter_id, click_id, conversion_type, amount_usd, commission_usd, status, metadata)
    values (offer.id, promoter.id, new_click, 'cpc', 0, commission,
      case when (select auto_approve_conversions from public.program_settings where id = 1) then 'approved' else 'pending' end,
      jsonb_build_object('source','cpc'));
  end if;

  return jsonb_build_object(
    'click_id', new_click,
    'destination_url', dest,
    'ref', trim(p_ref_slug),
    'offer_slug', offer.slug,
    'flagged', flagged
  );
end;
$$;

revoke execute on function public.record_click(text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_click(text, text, text, text, text, text, text, text, text, text, text) to service_role;
