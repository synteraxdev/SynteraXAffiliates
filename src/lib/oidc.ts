import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  oauthClientId,
  oauthClientSecret,
  synteraxAuthorizeUrl,
  synteraxFunctionsAnonKey,
  synteraxIssuer,
  synteraxJwksUrl,
  synteraxTokenUrl,
} from "@/lib/env";

const SCOPES = "openid profile email synterax.role synterax.status";

export function randomUrlToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("base64url");
}

export async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Buffer.from(digest).toString("base64url");
}

export function buildAuthorizeUrl(opts: {
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const url = new URL(synteraxAuthorizeUrl());
  url.searchParams.set("client_id", oauthClientId());
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", opts.state);
  url.searchParams.set("nonce", opts.nonce);
  url.searchParams.set("code_challenge", opts.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeAuthorizationCode(opts: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.codeVerifier,
    client_id: oauthClientId(),
    client_secret: oauthClientSecret(),
  });

  const response = await fetch(synteraxTokenUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: synteraxFunctionsAnonKey(),
      Authorization: `Bearer ${synteraxFunctionsAnonKey()}`,
    },
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error_description || json.error || "Token exchange failed");
  }
  return json;
}

export async function verifyIdToken(idToken: string, expectedNonce: string): Promise<JWTPayload> {
  const jwks = createRemoteJWKSet(new URL(synteraxJwksUrl()));
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: synteraxIssuer(),
    audience: oauthClientId(),
  });
  if (payload.nonce && payload.nonce !== expectedNonce) {
    throw new Error("OIDC nonce mismatch");
  }
  return payload;
}
