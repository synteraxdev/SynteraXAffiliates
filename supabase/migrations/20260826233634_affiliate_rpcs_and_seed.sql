create or replace function public.slugify(input text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.compute_commission(p_offer offers, p_amount numeric)
returns numeric
language plpgsql
immutable
set search_path to 'public'
as $$
begin
  if p_offer.payout_model = 'cpa' or p_offer.payout_model = 'cpl' or p_offer.payout_model = 'hybrid' then
    if p_offer.payout_model = 'hybrid' and coalesce(p_amount,0) > 0 and coalesce(p_offer.revshare_pct,0) > 0 then
      return round(coalesce(p_offer.cpa_amount_usd,0) + (p_amount * p_offer.revshare_pct / 100.0), 2);
    end if;
    return coalesce(p_offer.cpa_amount_usd, 0);
  elsif p_offer.payout_model = 'cpc' then
    return coalesce(p_offer.cpc_amount_usd, 0);
  elsif p_offer.payout_model = 'revshare' and coalesce(p_amount,0) > 0 then
    return round(p_amount * coalesce(p_offer.revshare_pct, 0) / 100.0, 2);
  end if;
  return 0;
end;
$$;

create or replace function public.build_offer_destination(
  p_offer offers,
  p_ref text,
  p_click_id text,
  p_origin text,
  p_sub1 text default null,
  p_sub2 text default null,
  p_sub3 text default null
)
returns text
language plpgsql
stable
set search_path to 'public'
as $$
declare
  origin text := trim(trailing '/' from coalesce(nullif(trim(p_origin), ''), 'https://synterax.io'));
  dest text := coalesce(nullif(trim(p_offer.destination_value), ''), '/');
  param text := coalesce(nullif(trim(p_offer.ref_param), ''), 'ref');
  url text;
  sep text;
begin
  if p_offer.destination_kind = 'sso_card' then
    url := 'https://www.synteraxcard.io/api/auth/signin/synterax?callbackUrl=' || replace(dest, ' ', '%20');
    url := url || '&' || param || '=' || p_ref || '&sx_click=' || p_click_id;
    return url;
  end if;

  if p_offer.destination_kind = 'internal' then
    if left(dest, 1) <> '/' then dest := '/' || dest; end if;
    if dest = '/' and p_offer.link_style = 'path' then
      return origin || '/' || p_ref;
    end if;
    if p_offer.link_style = 'path' then
      return origin || rtrim(dest, '/') || '/' || p_ref;
    end if;
    url := origin || dest;
  else
    url := dest;
  end if;

  if p_offer.link_style <> 'none' then
    sep := case when position('?' in url) > 0 then '&' else '?' end;
    url := url || sep || param || '=' || p_ref || '&sx_click=' || p_click_id;
  end if;

  if nullif(trim(p_sub1), '') is not null then
    sep := case when position('?' in url) > 0 then '&' else '?' end;
    url := url || sep || 'sub1=' || p_sub1;
  end if;
  if nullif(trim(p_sub2), '') is not null then
    sep := case when position('?' in url) > 0 then '&' else '?' end;
    url := url || sep || 'sub2=' || p_sub2;
  end if;
  if nullif(trim(p_sub3), '') is not null then
    sep := case when position('?' in url) > 0 then '&' else '?' end;
    url := url || sep || 'sub3=' || p_sub3;
  end if;

  if p_offer.destination_kind = 'external' and nullif(trim(p_ref), '') is not null then
    if url ~* '[?&]aff_id=' then
      url := regexp_replace(url, '([?&]aff_id=)[^&]*', E'\\1' || p_ref, 'i');
    else
      sep := case when position('?' in url) > 0 then '&' else '?' end;
      url := url || sep || 'aff_id=' || p_ref;
    end if;
  end if;
  return url;
end;
$$;

create or replace function public.upsert_sso_profile(
  p_id uuid,
  p_email text,
  p_username text,
  p_full_name text,
  p_role text,
  p_status text
)
returns profiles
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  row public.profiles;
  slug text;
  role text := coalesce(nullif(p_role,''), 'distributor');
  status text := coalesce(nullif(p_status,''), 'active');
begin
  if role not in ('company','admin','employee','distributor') then role := 'distributor'; end if;
  if status not in ('active','inactive','suspended','pending') then status := 'active'; end if;
  slug := coalesce(nullif(public.slugify(p_username), ''), nullif(public.slugify(p_email), ''), 'aff-' || substr(p_id::text, 1, 8));

  insert into public.profiles (id, email, username, full_name, role, status, referral_slug, last_login_at, updated_at)
  values (p_id, p_email, p_username, p_full_name, role, status, slug, now(), now())
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status,
    referral_slug = coalesce(public.profiles.referral_slug, excluded.referral_slug),
    last_login_at = now(),
    updated_at = now()
  returning * into row;
  return row;
end;
$$;

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

create or replace function public.record_conversion(
  p_click_id text,
  p_conversion_type text default null,
  p_external_id text default null,
  p_amount_usd numeric default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  click public.clicks;
  offer public.offers;
  commission numeric := 0;
  conv_id uuid;
  auto_ok boolean;
  today_count int;
  total_count int;
begin
  if coalesce(trim(p_click_id),'') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_click');
  end if;
  select * into click from public.clicks where click_id = trim(p_click_id);
  if click.id is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_click');
  end if;
  select * into offer from public.offers where id = click.offer_id;
  select auto_approve_conversions into auto_ok from public.program_settings where id = 1;

  if offer.conversion_cap is not null then
    select count(*) into total_count from public.conversions where offer_id = offer.id and status <> 'rejected';
    if total_count >= offer.conversion_cap then
      return jsonb_build_object('ok', false, 'reason', 'conversion_cap');
    end if;
  end if;
  if offer.daily_conversion_cap is not null then
    select count(*) into today_count from public.conversions where offer_id = offer.id and status <> 'rejected' and created_at >= date_trunc('day', now());
    if today_count >= offer.daily_conversion_cap then
      return jsonb_build_object('ok', false, 'reason', 'daily_cap');
    end if;
  end if;

  commission := public.compute_commission(offer, p_amount_usd);
  insert into public.conversions (offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd, status, metadata)
  values (
    click.offer_id, click.promoter_id, click.click_id,
    coalesce(nullif(trim(p_conversion_type),''), offer.conversion_type),
    nullif(trim(p_external_id),''),
    coalesce(p_amount_usd,0),
    commission,
    case when auto_ok then 'approved' else 'pending' end,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (offer_id, external_id) where external_id is not null
  do nothing
  returning id into conv_id;

  if conv_id is null and p_external_id is not null then
    select id into conv_id from public.conversions where offer_id = click.offer_id and external_id = trim(p_external_id);
    return jsonb_build_object('ok', true, 'duplicate', true, 'conversion_id', conv_id);
  end if;
  return jsonb_build_object('ok', true, 'conversion_id', conv_id, 'commission_usd', commission);
end;
$$;

create or replace function public.record_postback(
  p_offer_slug text,
  p_secret text,
  p_click_id text default null,
  p_ref_slug text default null,
  p_external_id text default null,
  p_amount_usd numeric default 0,
  p_status text default 'pending'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  named public.offers;
  target public.offers;
  stored text;
  click public.clicks;
  promoter uuid;
  commission numeric := 0;
  conv_id uuid;
  st text := coalesce(nullif(trim(p_status), ''), 'pending');
begin
  if st not in ('pending','approved','rejected','paid') then st := 'pending'; end if;
  if coalesce(p_secret,'') = '' then
    raise exception 'Invalid postback secret' using errcode = '42501';
  end if;
  if coalesce(trim(p_offer_slug),'') <> '' then
    select * into named from public.offers where slug = lower(trim(p_offer_slug));
  end if;
  if coalesce(trim(p_click_id),'') <> '' then
    select * into click from public.clicks where click_id = trim(p_click_id);
  end if;
  if click.id is not null then
    select * into target from public.offers where id = click.offer_id;
    promoter := click.promoter_id;
  elsif named.id is not null then
    target := named;
    if coalesce(trim(p_ref_slug),'') <> '' then
      select p.id into promoter from public.profiles p
      where lower(p.referral_slug) = lower(trim(p_ref_slug)) or lower(p.username) = lower(trim(p_ref_slug))
      limit 1;
    end if;
  else
    raise exception 'Unknown offer' using errcode = 'P0002';
  end if;
  if target.id is null then
    raise exception 'Unknown offer' using errcode = 'P0002';
  end if;
  select s.secret into stored from public.offer_secrets s
    where s.secret is not distinct from p_secret
      and s.offer_id in (target.id, coalesce(named.id, target.id))
    limit 1;
  if stored is null then
    raise exception 'Invalid postback secret' using errcode = '42501';
  end if;
  if promoter is null then
    raise exception 'Could not attribute conversion' using errcode = 'P0002';
  end if;
  commission := public.compute_commission(target, p_amount_usd);
  insert into public.conversions (offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd, status, metadata)
  values (target.id, promoter, click.click_id, 'postback', nullif(trim(p_external_id),''), coalesce(p_amount_usd,0), commission, st, jsonb_build_object('source','postback'))
  on conflict (offer_id, external_id) where external_id is not null
  do nothing
  returning id into conv_id;
  if conv_id is null and p_external_id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'offer_slug', target.slug);
  end if;
  return jsonb_build_object('ok', true, 'conversion_id', conv_id, 'commission_usd', commission, 'offer_slug', target.slug);
end;
$$;

insert into public.offers (
  slug, name, description, category, destination_kind, destination_value, link_style, ref_param,
  conversion_type, payout_model, cpa_amount_usd, cpc_amount_usd, revshare_pct, cookie_hours,
  attribution, terms, cta_label, is_active, member_visible, requires_approval, sort_order
) values
  ('membership', 'Membership signup', 'Promote SynteraX annual membership. Conversions fire on paid plan orders.', 'membership', 'internal', '/register', 'path', 'ref', 'plan_order', 'revshare', 0, 0, 20, 720, 'last_click', 'Paid memberships only. Reversals apply on refunds.', 'Get membership link', true, true, false, 10),
  ('lander', 'Homepage lander', 'Send traffic to the SynteraX homepage. Tracked on signup.', 'awareness', 'internal', '/', 'path', 'ref', 'signup', 'none', 0, 0, null, 720, 'last_click', 'Awareness offer. No default payout.', 'Get lander link', true, true, false, 20),
  ('debit-card', 'SynteraX Debit Card', 'Promote the in-app debit card request flow.', 'card', 'internal', '/debit-card', 'query', 'ref', 'postback', 'cpa', 25, 0, null, 720, 'last_click', 'CPA paid after approved card request postback.', 'Get card link', true, true, false, 30),
  ('synteraxcard', 'SynteraX Card apply', 'SSO into SynteraX Card and complete an application.', 'card', 'sso_card', '/order', 'query', 'ref', 'postback', 'cpa', 40, 0, null, 720, 'last_click', 'Server-to-server postback required. Duplicate order IDs are ignored.', 'Get Card apply link', true, true, false, 40),
  ('xflow-partner', 'XFLOW partner landing', 'External partner landing for XFLOW ecosystem campaigns.', 'ecosystem', 'external', 'https://synterax.io/?utm_source=affiliates', 'query', 'ref', 'postback', 'hybrid', 15, 0, 5, 720, 'last_click', 'Hybrid: $15 CPA plus 5% of reported revenue.', 'Get partner link', true, true, false, 50)
on conflict (slug) do nothing;

insert into public.offer_secrets (offer_id, secret)
select o.id, encode(extensions.gen_random_bytes(24), 'hex')
from public.offers o
where not exists (select 1 from public.offer_secrets s where s.offer_id = o.id);

insert into public.offer_creatives (offer_id, kind, name, body)
select o.id, 'text', 'Short blurb', 'Join SynteraX — forecast outcomes, build reputation, and earn XFLOW. ' || o.name
from public.offers o
where not exists (select 1 from public.offer_creatives c where c.offer_id = o.id and c.name = 'Short blurb');

insert into public.offer_creatives (offer_id, kind, name, body)
select o.id, 'email', 'Invite email', 'Subject: I saved you a seat on SynteraX' || E'\n\n' || 'Use my link to join the intelligence network and start earning on activity that actually matters.'
from public.offers o
where not exists (select 1 from public.offer_creatives c where c.offer_id = o.id and c.name = 'Invite email');
