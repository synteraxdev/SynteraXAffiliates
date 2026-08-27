-- Hold/clawback, outbound postbacks, notifications, smartlink, applications,
-- partner tiers, geo/device, attribution, coupons.

create table if not exists public.partner_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  rank int not null default 0,
  cpa_multiplier numeric not null default 1,
  revshare_bonus_pct numeric not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.partner_tiers (slug, name, rank, cpa_multiplier, revshare_bonus_pct, is_default)
values
  ('bronze', 'Bronze', 10, 1.00, 0, true),
  ('silver', 'Silver', 20, 1.10, 2, false),
  ('gold', 'Gold', 30, 1.25, 5, false)
on conflict (slug) do nothing;

alter table public.program_settings
  add column if not exists hold_days int not null default 14,
  add column if not exists smartlink_fallback_slug text not null default 'lander';

alter table public.offers
  add column if not exists allowed_devices text[],
  add column if not exists smartlink_enabled boolean not null default true,
  add column if not exists smartlink_weight int not null default 100,
  add column if not exists hold_days int;

alter table public.profiles
  add column if not exists tier_id uuid references public.partner_tiers(id) on delete set null,
  add column if not exists postback_url text,
  add column if not exists postback_method text not null default 'GET';

update public.profiles p
set tier_id = (select id from public.partner_tiers where is_default = true order by rank limit 1)
where p.tier_id is null;

create table if not exists public.offer_payout_overrides (
  offer_id uuid not null references public.offers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cpa_amount_usd numeric,
  cpc_amount_usd numeric,
  revshare_pct numeric,
  created_at timestamptz not null default now(),
  primary key (offer_id, profile_id)
);

create table if not exists public.offer_applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  accepted_terms boolean not null default false,
  note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (offer_id, profile_id)
);

alter table public.clicks
  add column if not exists visitor_id text;

create index if not exists clicks_visitor_created_idx on public.clicks (visitor_id, created_at desc);

alter table public.conversions
  add column if not exists held_until timestamptz,
  add column if not exists original_commission_usd numeric,
  add column if not exists attribution_model text,
  add column if not exists visitor_id text,
  add column if not exists coupon_code text,
  add column if not exists clawback_reason text,
  add column if not exists refunded_at timestamptz,
  add column if not exists clawed_back_at timestamptz;

alter table public.conversions drop constraint if exists conversions_status_check;
alter table public.conversions add constraint conversions_status_check
  check (status in ('pending','approved','rejected','paid','refunded','clawed_back'));

update public.conversions
set original_commission_usd = commission_usd
where original_commission_usd is null;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  offer_id uuid references public.offers(id) on delete cascade,
  promoter_id uuid not null references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  entity text,
  entity_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile_created_idx on public.notifications (profile_id, created_at desc);

create table if not exists public.outbound_postbacks (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references public.conversions(id) on delete set null,
  promoter_id uuid references public.profiles(id) on delete cascade,
  url text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  response_code int,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.partner_tiers enable row level security;
alter table public.offer_payout_overrides enable row level security;
alter table public.offer_applications enable row level security;
alter table public.coupons enable row level security;
alter table public.notifications enable row level security;
alter table public.outbound_postbacks enable row level security;

create or replace function public.notify_user(
  p_profile_id uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_entity text default null,
  p_entity_id text default null
)
returns void
language plpgsql
security definer
set search_path to public
as $$
begin
  if p_profile_id is null then return; end if;
  insert into public.notifications (profile_id, kind, title, body, entity, entity_id)
  values (p_profile_id, p_kind, p_title, p_body, p_entity, p_entity_id);
end;
$$;

create or replace function public.notify_admins(
  p_kind text,
  p_title text,
  p_body text default null,
  p_entity text default null,
  p_entity_id text default null
)
returns void
language plpgsql
security definer
set search_path to public
as $$
begin
  insert into public.notifications (profile_id, kind, title, body, entity, entity_id)
  select id, p_kind, p_title, p_body, p_entity, p_entity_id
  from public.profiles
  where role in ('admin','company') and status = 'active';
end;
$$;

create or replace function public.effective_rates(p_offer offers, p_promoter_id uuid)
returns table(cpa_amount_usd numeric, cpc_amount_usd numeric, revshare_pct numeric)
language plpgsql
stable
set search_path to public
as $$
declare
  ov public.offer_payout_overrides;
  tier public.partner_tiers;
  cpa numeric := coalesce(p_offer.cpa_amount_usd, 0);
  cpc numeric := coalesce(p_offer.cpc_amount_usd, 0);
  rev numeric := coalesce(p_offer.revshare_pct, 0);
begin
  select * into ov from public.offer_payout_overrides
    where offer_id = p_offer.id and profile_id = p_promoter_id;
  if ov.profile_id is not null then
    return query select
      coalesce(ov.cpa_amount_usd, cpa),
      coalesce(ov.cpc_amount_usd, cpc),
      coalesce(ov.revshare_pct, rev);
    return;
  end if;
  select t.* into tier
  from public.profiles p
  left join public.partner_tiers t on t.id = p.tier_id
  where p.id = p_promoter_id;
  if tier.id is not null then
    cpa := round(cpa * coalesce(tier.cpa_multiplier, 1), 2);
    cpc := round(cpc * coalesce(tier.cpa_multiplier, 1), 2);
    rev := rev + coalesce(tier.revshare_bonus_pct, 0);
  end if;
  return query select cpa, cpc, rev;
end;
$$;

create or replace function public.compute_commission_for(
  p_offer offers,
  p_promoter_id uuid,
  p_amount numeric
)
returns numeric
language plpgsql
stable
set search_path to public
as $$
declare
  rates record;
  offer_copy public.offers;
begin
  select * into rates from public.effective_rates(p_offer, p_promoter_id);
  offer_copy := p_offer;
  offer_copy.cpa_amount_usd := rates.cpa_amount_usd;
  offer_copy.cpc_amount_usd := rates.cpc_amount_usd;
  offer_copy.revshare_pct := rates.revshare_pct;
  return public.compute_commission(offer_copy, p_amount);
end;
$$;

create or replace function public.conversion_hold_until(p_offer offers)
returns timestamptz
language plpgsql
stable
set search_path to public
as $$
declare
  days int;
begin
  select coalesce(p_offer.hold_days, s.hold_days, 14) into days
  from public.program_settings s where s.id = 1;
  return now() + make_interval(days => greatest(days, 0));
end;
$$;

create or replace function public.enqueue_outbound_postback(
  p_conversion_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path to public
as $$
declare
  conv public.conversions;
  promoter public.profiles;
  offer public.offers;
  rendered text;
begin
  select * into conv from public.conversions where id = p_conversion_id;
  if conv.id is null then return; end if;
  select * into promoter from public.profiles where id = conv.promoter_id;
  if coalesce(nullif(trim(promoter.postback_url), ''), '') = '' then return; end if;
  select * into offer from public.offers where id = conv.offer_id;
  rendered := promoter.postback_url;
  rendered := replace(rendered, '{clickid}', coalesce(conv.click_id, ''));
  rendered := replace(rendered, '{click_id}', coalesce(conv.click_id, ''));
  rendered := replace(rendered, '{payout}', coalesce(conv.commission_usd::text, '0'));
  rendered := replace(rendered, '{amount}', coalesce(conv.amount_usd::text, '0'));
  rendered := replace(rendered, '{status}', coalesce(p_status, conv.status));
  rendered := replace(rendered, '{offer}', coalesce(offer.slug, ''));
  rendered := replace(rendered, '{aff_id}', coalesce(promoter.referral_slug, ''));
  rendered := replace(rendered, '{external_id}', coalesce(conv.external_id, ''));
  rendered := replace(rendered, '{txn}', coalesce(conv.external_id, ''));
  insert into public.outbound_postbacks (conversion_id, promoter_id, url)
  values (conv.id, promoter.id, rendered);
end;
$$;

create or replace function public.initial_conversion_status(p_requested text, p_auto boolean)
returns text
language plpgsql
immutable
as $$
begin
  if p_requested in ('rejected','refunded','clawed_back') then
    return p_requested;
  end if;
  if p_auto and p_requested in ('approved','paid') then
    return p_requested;
  end if;
  if p_auto then
    return 'approved';
  end if;
  return 'pending';
end;
$$;

-- Keep original upsert, but assign default tier for new rows.
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
set search_path to public
as $$
declare
  row public.profiles;
  slug text;
  role text := coalesce(nullif(p_role,''), 'distributor');
  status text := coalesce(nullif(p_status,''), 'active');
  default_tier uuid;
begin
  if role not in ('company','admin','employee','distributor') then role := 'distributor'; end if;
  if status not in ('active','inactive','suspended','pending') then status := 'active'; end if;
  slug := coalesce(nullif(public.slugify(p_username), ''), nullif(public.slugify(p_email), ''), 'aff-' || substr(p_id::text, 1, 8));
  select id into default_tier from public.partner_tiers where is_default order by rank limit 1;

  insert into public.profiles (id, email, username, full_name, role, status, referral_slug, tier_id, last_login_at, updated_at)
  values (p_id, p_email, p_username, p_full_name, role, status, slug, default_tier, now(), now())
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status,
    referral_slug = coalesce(public.profiles.referral_slug, excluded.referral_slug),
    tier_id = coalesce(public.profiles.tier_id, excluded.tier_id),
    last_login_at = now(),
    updated_at = now()
  returning * into row;
  return row;
end;
$$;

drop function if exists public.record_click(text, text, text, text, text, text, text, text, text, text, text);

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
  p_sub3 text default null,
  p_visitor_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to public, extensions
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
  today_count int;
  commission numeric := 0;
  remaining int;
  conv_id uuid;
  auto_ok boolean;
  hold_until timestamptz;
  country_ok boolean := true;
  device_ok boolean := true;
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
    return jsonb_build_object(
      'ok', false, 'blocked', true, 'reason', 'access',
      'offer_slug', offer.slug, 'offer_name', offer.name
    );
  end if;

  if offer.allowed_countries is not null and cardinality(offer.allowed_countries) > 0 then
    country_ok := coalesce(p_country, '') <> '' and exists (
      select 1 from unnest(offer.allowed_countries) c where upper(c) = upper(p_country)
    );
    if not country_ok then
      return jsonb_build_object(
        'ok', false, 'blocked', true, 'reason', 'geo',
        'offer_slug', offer.slug, 'offer_name', offer.name,
        'country', p_country, 'allowed_countries', to_jsonb(offer.allowed_countries)
      );
    end if;
  end if;

  if offer.allowed_devices is not null and cardinality(offer.allowed_devices) > 0 then
    device_ok := coalesce(p_device, '') <> '' and exists (
      select 1 from unnest(offer.allowed_devices) d where lower(d) = lower(p_device)
    );
    if not device_ok then
      return jsonb_build_object(
        'ok', false, 'blocked', true, 'reason', 'device',
        'offer_slug', offer.slug, 'offer_name', offer.name,
        'device', p_device, 'allowed_devices', to_jsonb(offer.allowed_devices)
      );
    end if;
  end if;

  if offer.click_cap is not null then
    select count(*) into click_count from public.clicks where offer_id = offer.id;
    if click_count >= offer.click_cap then
      return jsonb_build_object(
        'ok', false, 'blocked', true, 'reason', 'click_cap',
        'offer_slug', offer.slug, 'offer_name', offer.name
      );
    end if;
  end if;

  if offer.daily_conversion_cap is not null then
    select count(*) into today_count from public.conversions
      where offer_id = offer.id and status not in ('rejected','refunded','clawed_back')
        and created_at >= date_trunc('day', now());
    remaining := greatest(offer.daily_conversion_cap - today_count, 0);
    if remaining <= 0 then
      return jsonb_build_object(
        'ok', false, 'blocked', true, 'reason', 'daily_cap',
        'offer_slug', offer.slug, 'offer_name', offer.name, 'remaining_daily_cap', 0
      );
    end if;
  end if;

  if offer.conversion_cap is not null then
    select count(*) into click_count from public.conversions
      where offer_id = offer.id and status not in ('rejected','refunded','clawed_back');
    if click_count >= offer.conversion_cap then
      return jsonb_build_object(
        'ok', false, 'blocked', true, 'reason', 'conversion_cap',
        'offer_slug', offer.slug, 'offer_name', offer.name
      );
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

  insert into public.clicks (click_id, offer_id, promoter_id, landing_url, user_agent, referer, ip_hash, country, device, sub1, sub2, sub3, flagged, visitor_id)
  values (new_click, offer.id, promoter.id, dest, left(coalesce(p_user_agent,''),400), left(coalesce(p_referer,''),500), p_ip_hash, p_country, p_device, p_sub1, p_sub2, p_sub3, flagged, nullif(trim(p_visitor_id),''));

  if flagged then
    insert into public.fraud_events (click_id, promoter_id, offer_id, reason, detail)
    values (new_click, promoter.id, offer.id, 'click_velocity', jsonb_build_object('ip_hash', p_ip_hash, 'window_clicks', velocity + 1));
    perform public.notify_user(promoter.id, 'fraud', 'Traffic flagged', 'A click was flagged for velocity. Review your sources.', 'fraud_events', new_click);
    perform public.notify_admins('fraud', 'Fraud flag', coalesce(promoter.username, promoter.referral_slug) || ' hit click velocity on ' || offer.slug, 'fraud_events', new_click);
  end if;

  if offer.payout_model = 'cpc' and not flagged then
    select auto_approve_conversions into auto_ok from public.program_settings where id = 1;
    commission := public.compute_commission_for(offer, promoter.id, 0);
    hold_until := case when auto_ok then null else public.conversion_hold_until(offer) end;
    insert into public.conversions (
      offer_id, promoter_id, click_id, conversion_type, amount_usd, commission_usd, original_commission_usd,
      status, metadata, held_until, attribution_model, visitor_id
    )
    values (
      offer.id, promoter.id, new_click, 'cpc', 0, commission, commission,
      public.initial_conversion_status('pending', auto_ok),
      jsonb_build_object('source','cpc'), hold_until, offer.attribution, nullif(trim(p_visitor_id),'')
    )
    returning id into conv_id;
    perform public.enqueue_outbound_postback(conv_id, 'pending');
  end if;

  if offer.daily_conversion_cap is not null then
    remaining := greatest(offer.daily_conversion_cap - coalesce(today_count, 0), 0);
  else
    remaining := null;
  end if;

  return jsonb_build_object(
    'ok', true,
    'click_id', new_click,
    'destination_url', dest,
    'ref', trim(p_ref_slug),
    'offer_slug', offer.slug,
    'flagged', flagged,
    'remaining_daily_cap', remaining
  );
end;
$$;

create or replace function public.pick_attributed_click(
  p_offer public.offers,
  p_seed public.clicks
)
returns public.clicks
language plpgsql
stable
set search_path to public
as $$
declare
  chosen public.clicks;
  hours int := coalesce(p_offer.cookie_hours, 720);
begin
  if p_seed.id is null then
    return p_seed;
  end if;
  if coalesce(p_offer.attribution, 'last_click') = 'first_click' and coalesce(p_seed.visitor_id, '') <> '' then
    select * into chosen from public.clicks
    where offer_id = p_offer.id
      and visitor_id = p_seed.visitor_id
      and created_at >= now() - make_interval(hours => hours)
    order by created_at asc
    limit 1;
    if chosen.id is not null then return chosen; end if;
  end if;
  if coalesce(p_offer.attribution, 'last_click') = 'last_click' and coalesce(p_seed.visitor_id, '') <> '' then
    select * into chosen from public.clicks
    where offer_id = p_offer.id
      and visitor_id = p_seed.visitor_id
      and created_at >= now() - make_interval(hours => hours)
    order by created_at desc
    limit 1;
    if chosen.id is not null then return chosen; end if;
  end if;
  return p_seed;
end;
$$;

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
  total numeric;
  share numeric;
  rem numeric;
  conv_id uuid;
  first_id uuid;
  ids uuid[] := '{}';
begin
  select count(*) into n from public.clicks
  where offer_id = p_offer.id
    and visitor_id = p_seed.visitor_id
    and created_at >= now() - make_interval(hours => hours);
  if n < 2 then
    return null;
  end if;
  total := public.compute_commission_for(p_offer, p_seed.promoter_id, p_amount);
  -- Use seed promoter rates only as fallback; each click uses its promoter.
  rem := 0;
  for click in
    select * from public.clicks
    where offer_id = p_offer.id
      and visitor_id = p_seed.visitor_id
      and created_at >= now() - make_interval(hours => hours)
    order by created_at
  loop
    idx := idx + 1;
    share := public.compute_commission_for(p_offer, click.promoter_id, p_amount);
    -- equal split of the seed amount's computed commission, not per-promoter full pay
    share := round((public.compute_commission_for(p_offer, p_seed.promoter_id, p_amount) / n::numeric), 2);
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
      offer, seed,
      coalesce(nullif(trim(p_conversion_type),''), offer.conversion_type),
      nullif(trim(p_external_id),''), p_amount_usd, st, coalesce(p_metadata, '{}'::jsonb)
    );
    if linear_result is not null then
      return linear_result;
    end if;
  end if;

  commission := public.compute_commission_for(offer, click.promoter_id, p_amount_usd);
  insert into public.conversions (
    offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd,
    original_commission_usd, status, metadata, held_until, attribution_model, visitor_id
  )
  values (
    click.offer_id, click.promoter_id, click.click_id,
    coalesce(nullif(trim(p_conversion_type),''), offer.conversion_type),
    nullif(trim(p_external_id),''),
    coalesce(p_amount_usd,0),
    commission, commission, st,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('seed_click', seed.click_id, 'attributed_click', click.click_id),
    case when st = 'pending' then public.conversion_hold_until(offer) else null end,
    offer.attribution, click.visitor_id
  )
  on conflict (offer_id, external_id) where external_id is not null
  do nothing
  returning id into conv_id;

  if conv_id is null and p_external_id is not null then
    select id into conv_id from public.conversions where offer_id = click.offer_id and external_id = trim(p_external_id);
    return jsonb_build_object('ok', true, 'duplicate', true, 'conversion_id', conv_id);
  end if;
  perform public.enqueue_outbound_postback(conv_id, st);
  if st = 'approved' then
    perform public.notify_user(click.promoter_id, 'conversion.approved', 'Conversion approved', 'A conversion on ' || offer.name || ' is payable.', 'conversions', conv_id::text);
  end if;
  return jsonb_build_object('ok', true, 'conversion_id', conv_id, 'commission_usd', commission, 'attribution', offer.attribution);
end;
$$;

drop function if exists public.record_postback(text, text, text, text, text, numeric, text);

create or replace function public.record_postback(
  p_offer_slug text,
  p_secret text,
  p_click_id text default null,
  p_ref_slug text default null,
  p_external_id text default null,
  p_amount_usd numeric default 0,
  p_status text default 'pending',
  p_coupon text default null
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

  if target.attribution = 'linear' and seed.id is not null and coalesce(seed.visitor_id,'') <> '' then
    linear_result := public.record_linear_conversions(
      target, seed, 'postback', nullif(trim(p_external_id),''), p_amount_usd, st,
      jsonb_build_object('source','postback','coupon', p_coupon)
    );
    if linear_result is not null then
      return linear_result || jsonb_build_object('offer_slug', target.slug);
    end if;
  end if;

  commission := public.compute_commission_for(target, promoter, p_amount_usd);
  insert into public.conversions (
    offer_id, promoter_id, click_id, conversion_type, external_id, amount_usd, commission_usd,
    original_commission_usd, status, metadata, held_until, attribution_model, visitor_id, coupon_code
  )
  values (
    target.id, promoter, click.click_id, 'postback', nullif(trim(p_external_id),''),
    coalesce(p_amount_usd,0), commission, commission, st,
    jsonb_build_object('source','postback','coupon', p_coupon),
    case when st = 'pending' then public.conversion_hold_until(target) else null end,
    target.attribution, click.visitor_id, nullif(upper(trim(p_coupon)), '')
  )
  on conflict (offer_id, external_id) where external_id is not null
  do nothing
  returning id into conv_id;
  if conv_id is null and p_external_id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'offer_slug', target.slug);
  end if;
  perform public.enqueue_outbound_postback(conv_id, st);
  if st = 'approved' then
    perform public.notify_user(promoter, 'conversion.approved', 'Conversion approved', 'A conversion on ' || target.name || ' is payable.', 'conversions', conv_id::text);
  end if;
  return jsonb_build_object('ok', true, 'conversion_id', conv_id, 'commission_usd', commission, 'offer_slug', target.slug, 'attribution', target.attribution);
end;
$$;

create or replace function public.resolve_smartlink(
  p_ref_slug text,
  p_country text default null,
  p_device text default null
)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  settings public.program_settings;
  offer public.offers;
  today_count int;
  click_count int;
  approved boolean;
  epc numeric;
begin
  select * into settings from public.program_settings where id = 1;
  for offer in
    select o.*
    from public.offers o
    left join lateral (
      select
        count(*)::numeric as clicks,
        coalesce(sum(c.commission_usd) filter (where c.status in ('approved','paid')), 0) as payout
      from public.clicks k
      left join public.conversions c on c.click_id = k.click_id
      where k.offer_id = o.id and k.created_at > now() - interval '14 days'
    ) perf on true
    where o.is_active and o.member_visible and o.smartlink_enabled and o.payout_model <> 'none'
    order by
      case when perf.clicks > 0 then perf.payout / perf.clicks else 0 end desc,
      o.smartlink_weight desc,
      o.sort_order
  loop
    if offer.requires_approval then
      select exists (
        select 1
        from public.profiles p
        join public.offer_access a on a.profile_id = p.id and a.offer_id = offer.id
        where lower(p.referral_slug) = lower(trim(p_ref_slug)) or lower(p.username) = lower(trim(p_ref_slug))
      ) into approved;
      if not approved then continue; end if;
    end if;
    if offer.allowed_countries is not null and cardinality(offer.allowed_countries) > 0 then
      if coalesce(p_country,'') = '' or not exists (
        select 1 from unnest(offer.allowed_countries) c where upper(c) = upper(p_country)
      ) then
        continue;
      end if;
    end if;
    if offer.allowed_devices is not null and cardinality(offer.allowed_devices) > 0 then
      if coalesce(p_device,'') = '' or not exists (
        select 1 from unnest(offer.allowed_devices) d where lower(d) = lower(p_device)
      ) then
        continue;
      end if;
    end if;
    if offer.daily_conversion_cap is not null then
      select count(*) into today_count from public.conversions
        where offer_id = offer.id and status not in ('rejected','refunded','clawed_back')
          and created_at >= date_trunc('day', now());
      if today_count >= offer.daily_conversion_cap then continue; end if;
    end if;
    if offer.conversion_cap is not null then
      select count(*) into click_count from public.conversions
        where offer_id = offer.id and status not in ('rejected','refunded','clawed_back');
      if click_count >= offer.conversion_cap then continue; end if;
    end if;
    if offer.click_cap is not null then
      select count(*) into click_count from public.clicks where offer_id = offer.id;
      if click_count >= offer.click_cap then continue; end if;
    end if;
    return jsonb_build_object('ok', true, 'offer_slug', offer.slug, 'fallback', false);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'offer_slug', coalesce(nullif(settings.smartlink_fallback_slug,''), 'lander'),
    'fallback', true
  );
end;
$$;

create or replace function public.release_held_conversions()
returns int
language plpgsql
security definer
set search_path to public
as $$
declare
  n int := 0;
  conv public.conversions;
  offer public.offers;
begin
  for conv in
    select * from public.conversions
    where status = 'pending' and held_until is not null and held_until <= now()
  loop
    select * into offer from public.offers where id = conv.offer_id;
    if (select auto_approve_conversions from public.program_settings where id = 1) then
      update public.conversions
        set status = 'approved', held_until = null, reviewed_at = now()
        where id = conv.id;
      perform public.notify_user(conv.promoter_id, 'conversion.approved', 'Hold released', 'A conversion on ' || offer.name || ' is now payable.', 'conversions', conv.id::text);
      perform public.enqueue_outbound_postback(conv.id, 'approved');
    else
      update public.conversions set held_until = null where id = conv.id;
      perform public.notify_admins('conversion.review', 'Hold expired', offer.name || ' conversion is ready for review', 'conversions', conv.id::text);
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public.review_conversion(
  p_id uuid,
  p_status text,
  p_reason text default null,
  p_actor uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  conv public.conversions;
  offer public.offers;
begin
  if p_status not in ('approved','rejected','paid','refunded','clawed_back') then
    raise exception 'Invalid status';
  end if;
  select * into conv from public.conversions where id = p_id;
  if conv.id is null then
    raise exception 'Unknown conversion';
  end if;
  select * into offer from public.offers where id = conv.offer_id;

  if p_status = 'refunded' then
    if conv.status = 'paid' then
      raise exception 'Use clawback for paid conversions';
    end if;
    update public.conversions set
      status = 'refunded',
      commission_usd = 0,
      refunded_at = now(),
      clawback_reason = p_reason,
      reviewed_by = p_actor,
      reviewed_at = now(),
      held_until = null
    where id = p_id;
    perform public.notify_user(conv.promoter_id, 'conversion.refunded', 'Conversion refunded', 'Commission on ' || offer.name || ' was reversed before payout.', 'conversions', p_id::text);
    perform public.enqueue_outbound_postback(p_id, 'refunded');
  elsif p_status = 'clawed_back' then
    update public.conversions set
      status = 'clawed_back',
      commission_usd = 0,
      clawed_back_at = now(),
      clawback_reason = p_reason,
      reviewed_by = p_actor,
      reviewed_at = now(),
      held_until = null
    where id = p_id;
    perform public.notify_user(conv.promoter_id, 'conversion.clawback', 'Commission clawed back', 'A previously payable conversion on ' || offer.name || ' was reversed.', 'conversions', p_id::text);
    perform public.enqueue_outbound_postback(p_id, 'rejected');
  else
    update public.conversions set
      status = p_status,
      reviewed_by = p_actor,
      reviewed_at = now(),
      held_until = null
    where id = p_id;
    if p_status = 'approved' then
      perform public.notify_user(conv.promoter_id, 'conversion.approved', 'Conversion approved', 'A conversion on ' || offer.name || ' is payable.', 'conversions', p_id::text);
    elsif p_status = 'rejected' then
      perform public.notify_user(conv.promoter_id, 'conversion.rejected', 'Conversion rejected', 'A conversion on ' || offer.name || ' was rejected.', 'conversions', p_id::text);
    elsif p_status = 'paid' then
      perform public.notify_user(conv.promoter_id, 'payout.paid', 'Conversion marked paid', 'Commission on ' || offer.name || ' was marked paid.', 'conversions', p_id::text);
    end if;
    perform public.enqueue_outbound_postback(p_id, p_status);
  end if;
  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

revoke execute on function public.notify_user(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.enqueue_outbound_postback(uuid, text) from public, anon, authenticated;
revoke execute on function public.record_click(text, text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_conversion(text, text, text, numeric, jsonb) from public, anon, authenticated;
revoke execute on function public.record_postback(text, text, text, text, text, numeric, text, text) from public, anon, authenticated;
revoke execute on function public.resolve_smartlink(text, text, text) from public, anon, authenticated;
revoke execute on function public.release_held_conversions() from public, anon, authenticated;
revoke execute on function public.review_conversion(uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.upsert_sso_profile(uuid, text, text, text, text, text) from public, anon, authenticated;

grant execute on function public.notify_user(uuid, text, text, text, text, text) to service_role;
grant execute on function public.notify_admins(text, text, text, text, text) to service_role;
grant execute on function public.enqueue_outbound_postback(uuid, text) to service_role;
grant execute on function public.record_click(text, text, text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.record_conversion(text, text, text, numeric, jsonb) to service_role;
grant execute on function public.record_postback(text, text, text, text, text, numeric, text, text) to service_role;
grant execute on function public.resolve_smartlink(text, text, text) to service_role;
grant execute on function public.release_held_conversions() to service_role;
grant execute on function public.review_conversion(uuid, text, text, uuid) to service_role;
grant execute on function public.upsert_sso_profile(uuid, text, text, text, text, text) to service_role;

update public.offers set smartlink_enabled = true, smartlink_weight = 100 where smartlink_weight is null or smartlink_weight = 100;
update public.offers set smartlink_enabled = false where slug = 'lander';
update public.offers set smartlink_weight = 80 where slug = 'membership';
update public.offers set smartlink_weight = 70 where slug in ('debit-card','synteraxcard');
update public.offers set smartlink_weight = 40 where slug = 'xflow-partner';
