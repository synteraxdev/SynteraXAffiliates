function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback || "";
  return value;
}

// Dedicated affiliates project (synterax-affiliates). Never the main syntera DB.
export function affiliatesUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", "https://zhaihbknzqexpojhsjeh.supabase.co");
}

export function affiliatesAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYWloYmtuenFleHBvamhzamVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODcxNTUsImV4cCI6MjEwMzM2MzE1NX0.t0to0amVINUmtufdIEKvVSKbY9a2dO6Itqabk_47lok",
  );
}

export function affiliatesServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function synteraxIssuer(): string {
  return required("SYNTERAX_ISSUER", "https://synterax.io");
}

export function synteraxAuthorizeUrl(): string {
  return required("SYNTERAX_AUTHORIZATION_URL", "https://synterax.io/oauth/authorize");
}

export function synteraxTokenUrl(): string {
  return required(
    "SYNTERAX_TOKEN_URL",
    "https://pfszasaprbtdtcetgueq.supabase.co/functions/v1/oauth-token",
  );
}

export function synteraxJwksUrl(): string {
  return required("SYNTERAX_JWKS_URL", "https://synterax.io/.well-known/jwks.json");
}

export function synteraxFunctionsAnonKey(): string {
  return required(
    "SYNTERAX_FUNCTIONS_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc3phc2FwcmJ0ZHRjZXRndWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODI1MTEsImV4cCI6MjEwMTc1ODUxMX0.sxg_3SBVzcE-g60lTQYiJARft2zNxh3KDispUAQqLCs",
  );
}

export function oauthClientId(): string {
  return required("SYNTERAX_OAUTH_CLIENT_ID", "9bLEfeUP678uTFQnlkOp1Pqb");
}

export function oauthClientSecret(): string {
  return required("SYNTERAX_OAUTH_CLIENT_SECRET");
}

export function authSecret(): string {
  return required("AUTH_SECRET", "dev-only-change-me-in-production-please-32b");
}

export function appOrigin(requestUrl?: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") return "https://affiliates.synterax.io";
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function devLoginEnabled(): boolean {
  return !isProduction() && process.env.SYNTERAX_DEV_LOGIN === "1";
}
