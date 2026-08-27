# SynteraX Affiliates

Dedicated affiliate network for SynteraX. Admins publish offers. Members promote them with tracked links, postbacks, and payouts. Sign-in is SynteraX SSO — there is no second password.

This app **does not use the main SynteraX database**. All portal data lives in a separate Supabase project created for this repo.

## Databases

| Project | Ref | Purpose |
| --- | --- | --- |
| **synterax-affiliates** | `zhaihbknzqexpojhsjeh` | Offers, clicks, conversions, payouts, affiliate profiles |
| syntera | `pfszasaprbtdtcetgueq` | Identity only — OIDC authorize/token/userinfo on synterax.io |

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must point at **synterax-affiliates**. Do not point them at `syntera` or `synteraxcard`.

Schema and RPCs are in `supabase/migrations/`. They are already applied on the dedicated project.

## Features

- SynteraX OIDC SSO (`admin` / `company` vs `distributor` / `employee`)
- Offer marketplace with apply / terms / per-offer approval and a public `/marketplace` wall
- Partner tiers (Bronze / Silver / Gold) plus per-affiliate payout overrides
- Tracking links with sub IDs: `/go/{offer}/{ref}`
- Network smartlink `/go/network/{ref}` (geo, device, weight, EPC, cap) with lander trafficback
- Geo / device enforcement on `/go` with a friendly `/blocked` page and remaining daily cap in UI
- Hold (7–30 days), admin approve/reject, refund unpaid commission, clawback paid rows
- First-click / last-click / linear attribution from the raw click chain (`sx_vid`)
- Inbound S2S (`/t/postback`, coupon codes) and outbound affiliate postbacks (`{clickid}`, `{payout}`, `{status}`)
- In-app notifications: new offer, conversion approved, payout sent, fraud flag
- Vanity / coupon codes when cookies fail
- Creatives that bake `/go/...`, UTM presets, QR, and copy kits
- Click logging, velocity fraud flags, daily/total caps
- Duplicate `external_id` protection
- Affiliate dashboard, reports, and cash-out to SynteraX Vault (USD) or XFLOW tokens only
- Admin offer CRUD, applications, conversion review, payout approval, fraud queue, program settings

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required secrets in `.env.local` / Vercel:

- `SUPABASE_SERVICE_ROLE_KEY` — service role for **synterax-affiliates**
- `SYNTERAX_OAUTH_CLIENT_ID` / `SYNTERAX_OAUTH_CLIENT_SECRET` — first-party OAuth client on synterax.io
- `AUTH_SECRET` — signs the portal session cookie

Optional non-production demo login: `SYNTERAX_DEV_LOGIN=1`.

Production URL: https://affiliates.synterax.io

Redirect URIs registered on the OAuth client:

- `http://localhost:3000/api/auth/callback/synterax`
- `https://affiliates.synterax.io/api/auth/callback/synterax`

## Tracking

```
GET /go/{offerSlug}/{ref}?sub1=&sub2=&sub3=
GET /go/network/{ref}
GET /t/postback?offer=&secret=&click_id=&ref=&external_id=&amount=&status=&coupon=
GET /t/pixel?click_id=&external_id=&amount=
GET /api/cron/release-holds
```

Hourly cron releases expired holds and flushes outbound tracker postbacks.
