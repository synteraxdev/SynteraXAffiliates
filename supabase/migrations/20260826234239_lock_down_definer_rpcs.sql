-- SECURITY DEFINER RPCs must not be callable with the publishable/anon key.
revoke execute on function public.upsert_sso_profile(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_click(text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_conversion(text, text, text, numeric, jsonb) from public, anon, authenticated;
revoke execute on function public.record_postback(text, text, text, text, text, numeric, text) from public, anon, authenticated;

grant execute on function public.upsert_sso_profile(uuid, text, text, text, text, text) to service_role;
grant execute on function public.record_click(text, text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.record_conversion(text, text, text, numeric, jsonb) to service_role;
grant execute on function public.record_postback(text, text, text, text, text, numeric, text) to service_role;
