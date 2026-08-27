-- Affiliate cash-out can only go to the SynteraX Vault (USD) or XFLOW tokens.

update public.profiles
set payout_method = 'vault'
where payout_method is null or payout_method not in ('vault', 'xflow');

update public.payouts
set method = 'vault'
where method is null or method not in ('vault', 'xflow');

alter table public.profiles drop constraint if exists profiles_payout_method_check;
alter table public.profiles
  add constraint profiles_payout_method_check
  check (payout_method in ('vault', 'xflow'));

alter table public.payouts drop constraint if exists payouts_method_check;
alter table public.payouts
  add constraint payouts_method_check
  check (method in ('vault', 'xflow'));

alter table public.profiles
  alter column payout_method set default 'vault';

alter table public.payouts
  alter column method set default 'vault';
