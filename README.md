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
- Offer marketplace with CPA, CPC, CPL, RevShare, and hybrid payouts
- Tracking links with sub IDs: `/go/{offer}/{ref}`
- Click logging, velocity fraud flags, daily/total caps
- S2S postback (`/t/postback`) and 1×1 pixel (`/t/pixel`)
- Duplicate `external_id` protection
- Affiliate dashboard, reports, creatives, payout requests
- Admin offer CRUD, conversion review, payout approval, fraud queue, program settings

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
GET /t/postback?offer=&secret=&click_id=&ref=&external_id=&amount=&status=
GET /t/pixel?click_id=&external_id=&amount=
```
