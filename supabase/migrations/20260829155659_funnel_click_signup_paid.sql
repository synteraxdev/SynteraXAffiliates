-- Funnel events: click (non-payable), signup ($0), paid (commission).
-- Same customer can have both a signup and a paid conversion.

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('click', 'signup', 'paid')),
  click_id text,
  offer_id uuid references public.offers(id) on delete set null,
  promoter_id uuid references public.profiles(id) on delete set null,
  external_id text,
  amount_usd numeric not null default 0,
  source text not null default 'js',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tracking_events_click_idx
  on public.tracking_events (click_id, event_type, created_at desc);
create index if not exists tracking_events_offer_idx
  on public.tracking_events (offer_id, event_type, created_at desc);

alter table public.tracking_events enable row level security;

drop index if exists public.conversions_offer_external_idx;
create unique index if not exists conversions_offer_type_external_idx
  on public.conversions (offer_id, conversion_type, external_id)
  where external_id is not null;

create or replace function public.record_linear_conversions(
  p_offer public.offers,
  p_seed public.clicks,
  p_conversion_type text,
  p_external_id text,
  p_amount numeric,
  p_status text,
  p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  hours int := coalesce(p_offer.cookie_hours, 720);
  click public.clicks;
  n int := 0;
  idx int := 0;
  share numeric;
  conv_id uuid;
  first_id uuid;
  ids uuid[] := '{}';
  pay boolean := coalesce(p_conversion_type, '') not in ('signup', 'click');
begin
  select count(*) into n from public.clicks
  where offer_id = p_offer.id
    and visitor_id = p_seed.visitor_id
    and created_at >= now() - make_interval(hours => hours);
  if n < 2 then
    return null;
  end if;
  for click in
    select * from public.clicks
    where offer_id = p_offer.id
      and visitor_id = p_seed.visitor_id
      and created_at >= now() - make_interval(hours => hours)
    order by created_at
  loop
    idx := idx + 1;
    share := case
      when pay then round((public.compute_commission_for(p_offer, p_seed.promoter_id, p_amount) / n::numeric), 2)
      else 0
    end;
    insert into public.conversions (
      offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd,
      original_commission_usd, status, metadata, held_until, attribution_model, visitor_id
    ) values (
      p_offer.id, click.promoter_id, click.click_id, p_conversion_type,
      case when p_external_id is null then null else p_external_id || ':' || idx::text end,
      coalesce(p_amount,0), share, share, p_status,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('linear_group', p_external_id, 'linear_index', idx, 'linear_n', n),
      case when p_status = 'pending' then public.conversion_hold_until(p_offer) else null end,
      'linear', p_seed.visitor_id
    )
    returning id into conv_id;
    perform public.enqueue_outbound_postback(conv_id, p_status);
    ids := ids || conv_id;
    if first_id is null then first_id := conv_id; end if;
  end loop;
  return jsonb_build_object('ok', true, 'conversion_id', first_id, 'linear', true, 'count', n);
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
set search_path to public
as $$
declare
  seed public.clicks;
  click public.clicks;
  offer public.offers;
  commission numeric := 0;
  conv_id uuid;
  auto_ok boolean;
  today_count int;
  total_count int;
  st text;
  linear_result jsonb;
  v_type text;
begin
  if coalesce(trim(p_click_id),'') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_click');
  end if;
  select * into seed from public.clicks where click_id = trim(p_click_id);
  if seed.id is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_click');
  end if;
  select * into offer from public.offers where id = seed.offer_id;
  select auto_approve_conversions into auto_ok from public.program_settings where id = 1;
  click := public.pick_attributed_click(offer, seed);
  v_type := coalesce(nullif(trim(p_conversion_type),''), offer.conversion_type);

  if offer.conversion_cap is not null then
    select count(*) into total_count from public.conversions where offer_id = offer.id and status not in ('rejected','refunded','clawed_back');
    if total_count >= offer.conversion_cap then
      return jsonb_build_object('ok', false, 'reason', 'conversion_cap');
    end if;
  end if;
  if offer.daily_conversion_cap is not null then
    select count(*) into today_count from public.conversions
      where offer_id = offer.id and status not in ('rejected','refunded','clawed_back') and created_at >= date_trunc('day', now());
    if today_count >= offer.daily_conversion_cap then
      return jsonb_build_object('ok', false, 'reason', 'daily_cap');
    end if;
  end if;

  st := public.initial_conversion_status('pending', auto_ok);

  if offer.attribution = 'linear' and coalesce(seed.visitor_id,'') <> '' then
    linear_result := public.record_linear_conversions(
      offer, seed, v_type,
      nullif(trim(p_external_id),''), p_amount_usd, st, coalesce(p_metadata, '{}'::jsonb)
    );
    if linear_result is not null then
      return linear_result;
    end if;
  end if;

  if v_type in ('signup', 'click') then
    commission := 0;
  else
    commission := public.compute_commission_for(offer, click.promoter_id, p_amount_usd);
  end if;
  insert into public.conversions (
    offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd,
    original_commission_usd, status, metadata, held_until, attribution_model, visitor_id
  )
  values (
    click.offer_id, click.promoter_id, click.click_id, v_type,
    nullif(trim(p_external_id),''),
    coalesce(p_amount_usd,0),
    commission, commission, st,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('seed_click', seed.click_id, 'attributed_click', click.click_id),
    case when st = 'pending' then public.conversion_hold_until(offer) else null end,
    offer.attribution, click.visitor_id
  )
  on conflict (offer_id, conversion_type, external_id) where external_id is not null
  do nothing
  returning id into conv_id;

  if conv_id is null and p_external_id is not null then
    select id into conv_id from public.conversions
      where offer_id = click.offer_id and conversion_type = v_type and external_id = trim(p_external_id);
    return jsonb_build_object('ok', true, 'duplicate', true, 'conversion_id', conv_id, 'event', v_type);
  end if;
  perform public.enqueue_outbound_postback(conv_id, st);
  if st = 'approved' and commission > 0 then
    perform public.notify_user(click.promoter_id, 'conversion.approved', 'Conversion approved', 'A conversion on ' || offer.name || ' is payable.', 'conversions', conv_id::text);
  end if;
  return jsonb_build_object('ok', true, 'conversion_id', conv_id, 'commission_usd', commission, 'attribution', offer.attribution, 'event', v_type);
end;
$$;

drop function if exists public.record_postback(text, text, text, text, text, numeric, text, text);

create or replace function public.record_postback(
  p_offer_slug text,
  p_secret text,
  p_click_id text default null,
  p_ref_slug text default null,
  p_external_id text default null,
  p_amount_usd numeric default 0,
  p_status text default 'pending',
  p_coupon text default null,
  p_conversion_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  named public.offers;
  target public.offers;
  stored text;
  seed public.clicks;
  click public.clicks;
  promoter uuid;
  coupon_row public.coupons;
  commission numeric := 0;
  conv_id uuid;
  st text := coalesce(nullif(trim(p_status), ''), 'pending');
  auto_ok boolean;
  linear_result jsonb;
  v_type text;
begin
  if st not in ('pending','approved','rejected','paid','refunded','clawed_back') then st := 'pending'; end if;
  if coalesce(p_secret,'') = '' then
    raise exception 'Invalid postback secret' using errcode = '42501';
  end if;
  select auto_approve_conversions into auto_ok from public.program_settings where id = 1;
  st := public.initial_conversion_status(st, auto_ok);

  if coalesce(trim(p_offer_slug),'') <> '' then
    select * into named from public.offers where slug = lower(trim(p_offer_slug));
  end if;
  if coalesce(trim(p_click_id),'') <> '' then
    select * into seed from public.clicks where click_id = trim(p_click_id);
  end if;
  if coalesce(trim(p_coupon),'') <> '' then
    select * into coupon_row from public.coupons
      where upper(code) = upper(trim(p_coupon)) and is_active = true
    limit 1;
  end if;

  if seed.id is not null then
    select * into target from public.offers where id = seed.offer_id;
  elsif named.id is not null then
    target := named;
  elsif coupon_row.id is not null then
    if coupon_row.offer_id is not null then
      select * into target from public.offers where id = coupon_row.offer_id;
    end if;
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

  if seed.id is not null then
    click := public.pick_attributed_click(target, seed);
    promoter := click.promoter_id;
  elsif coupon_row.id is not null then
    promoter := coupon_row.promoter_id;
  elsif coalesce(trim(p_ref_slug),'') <> '' then
    select p.id into promoter from public.profiles p
    where lower(p.referral_slug) = lower(trim(p_ref_slug)) or lower(p.username) = lower(trim(p_ref_slug))
    limit 1;
  end if;

  if promoter is null then
    raise exception 'Could not attribute conversion' using errcode = 'P0002';
  end if;

  v_type := coalesce(nullif(trim(p_conversion_type),''), 'postback');

  if target.attribution = 'linear' and seed.id is not null and coalesce(seed.visitor_id,'') <> '' then
    linear_result := public.record_linear_conversions(
      target, seed, v_type, nullif(trim(p_external_id),''), p_amount_usd, st,
      jsonb_build_object('source','postback','coupon', p_coupon, 'event', v_type)
    );
    if linear_result is not null then
      return linear_result || jsonb_build_object('offer_slug', target.slug, 'event', v_type);
    end if;
  end if;

  if v_type in ('signup', 'click') then
    commission := 0;
  else
    commission := public.compute_commission_for(target, promoter, p_amount_usd);
  end if;
  insert into public.conversions (
    offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd,
    original_commission_usd, status, metadata, held_until, attribution_model, visitor_id, coupon_code
  )
  values (
    target.id, promoter, click.click_id, v_type, nullif(trim(p_external_id),''),
    coalesce(p_amount_usd,0), commission, commission, st,
    jsonb_build_object('source','postback','coupon', p_coupon, 'event', v_type),
    case when st = 'pending' then public.conversion_hold_until(target) else null end,
    target.attribution, click.visitor_id, nullif(upper(trim(p_coupon)), '')
  )
  on conflict (offer_id, conversion_type, external_id) where external_id is not null
  do nothing
  returning id into conv_id;
  if conv_id is null and p_external_id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'offer_slug', target.slug, 'event', v_type);
  end if;
  perform public.enqueue_outbound_postback(conv_id, st);
  if st = 'approved' and commission > 0 then
    perform public.notify_user(promoter, 'conversion.approved', 'Conversion approved', 'A conversion on ' || target.name || ' is payable.', 'conversions', conv_id::text);
  end if;
  return jsonb_build_object('ok', true, 'conversion_id', conv_id, 'commission_usd', commission, 'offer_slug', target.slug, 'attribution', target.attribution, 'event', v_type);
end;
$$;

revoke execute on function public.record_postback(text, text, text, text, text, numeric, text, text, text) from public, anon, authenticated;
grant execute on function public.record_postback(text, text, text, text, text, numeric, text, text, text) to service_role;
