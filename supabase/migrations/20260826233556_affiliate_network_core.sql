-- Dedicated SynteraX Affiliates database (project synterax-affiliates / zhaihbknzqexpojhsjeh).
-- Application access uses the service role. RLS is enabled with no public policies
-- so the Data API cannot be used with the publishable key.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key,
  email text,
  username text,
  full_name text,
  role text not null default 'distributor' check (role in ('company','admin','employee','distributor')),
  status text not null default 'active' check (status in ('active','inactive','suspended','pending')),
  referral_slug text unique,
  payout_method text not null default 'manual',
  payout_details jsonb not null default '{}'::jsonb,
  notes text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'SynteraX Affiliates',
  cookie_hours int not null default 720,
  min_payout_usd numeric not null default 50,
  auto_approve_conversions boolean not null default false,
  default_attribution text not null default 'last_click',
  click_velocity_limit int not null default 40,
  updated_at timestamptz not null default now()
);

insert into public.program_settings (id) values (1);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null default 'general',
  destination_kind text not null default 'external',
  destination_value text not null default '/',
  link_style text not null default 'query',
  ref_param text not null default 'ref',
  conversion_type text not null default 'postback',
  payout_model text not null default 'cpa',
  cpa_amount_usd numeric not null default 0,
  cpc_amount_usd numeric not null default 0,
  revshare_pct numeric,
  cookie_hours int not null default 720,
  attribution text not null default 'last_click',
  click_cap int,
  conversion_cap int,
  daily_conversion_cap int,
  allowed_countries text[],
  preview_image_url text,
  terms text,
  cta_label text not null default 'Get link',
  is_active boolean not null default true,
  member_visible boolean not null default true,
  requires_approval boolean not null default false,
  sort_order int not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offer_secrets (
  offer_id uuid primary key references public.offers(id) on delete cascade,
  secret text not null,
  updated_at timestamptz not null default now()
);

create table public.offer_creatives (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  kind text not null check (kind in ('text','html','image','email')),
  name text not null,
  body text not null default '',
  image_url text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create table public.offer_access (
  offer_id uuid not null references public.offers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (offer_id, profile_id)
);

create table public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  promoter_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  sub1 text,
  sub2 text,
  sub3 text,
  created_at timestamptz not null default now()
);

create table public.clicks (
  id uuid primary key default gen_random_uuid(),
  click_id text not null unique,
  offer_id uuid not null references public.offers(id) on delete cascade,
  promoter_id uuid not null references public.profiles(id) on delete cascade,
  landing_url text,
  user_agent text,
  referer text,
  ip_hash text,
  country text,
  device text,
  sub1 text,
  sub2 text,
  sub3 text,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index clicks_offer_created_idx on public.clicks (offer_id, created_at desc);
create index clicks_promoter_created_idx on public.clicks (promoter_id, created_at desc);
create index clicks_ip_created_idx on public.clicks (ip_hash, created_at desc);

create table public.conversions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  promoter_id uuid not null references public.profiles(id) on delete cascade,
  click_id text,
  conversion_type text not null,
  external_id text,
  amount_usd numeric not null default 0,
  commission_usd numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  metadata jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index conversions_offer_external_idx on public.conversions (offer_id, external_id) where external_id is not null;
create index conversions_offer_created_idx on public.conversions (offer_id, created_at desc);
create index conversions_promoter_status_idx on public.conversions (promoter_id, status, created_at desc);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references public.profiles(id) on delete cascade,
  amount_usd numeric not null,
  method text not null default 'manual',
  destination jsonb not null default '{}'::jsonb,
  status text not null default 'requested' check (status in ('requested','approved','paid','rejected','cancelled')),
  note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payout_items (
  payout_id uuid not null references public.payouts(id) on delete cascade,
  conversion_id uuid not null references public.conversions(id) on delete restrict,
  primary key (payout_id, conversion_id)
);

create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default array['conversion.created'::text],
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.fraud_events (
  id uuid primary key default gen_random_uuid(),
  click_id text,
  promoter_id uuid references public.profiles(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.program_settings enable row level security;
alter table public.offers enable row level security;
alter table public.offer_secrets enable row level security;
alter table public.offer_creatives enable row level security;
alter table public.offer_access enable row level security;
alter table public.tracking_links enable row level security;
alter table public.clicks enable row level security;
alter table public.conversions enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_items enable row level security;
alter table public.webhooks enable row level security;
alter table public.api_keys enable row level security;
alter table public.fraud_events enable row level security;
alter table public.audit_log enable row level security;
