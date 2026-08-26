import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { affiliatesServiceKey, affiliatesUrl } from "@/lib/env";

let service: SupabaseClient | null = null;

export function getServiceDb(): SupabaseClient {
  if (service) return service;
  const key = affiliatesServiceKey();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured for the affiliates database.");
  }
  service = createClient(affiliatesUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return service;
}

export function hasServiceDb(): boolean {
  return Boolean(affiliatesServiceKey());
}
