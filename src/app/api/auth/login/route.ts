import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/env";
import { buildAuthorizeUrl, randomUrlToken, sha256Base64Url } from "@/lib/oidc";

export async function GET(request: Request) {
  const origin = appOrigin(request.url);
  const redirectUri = `${origin}/api/auth/callback/synterax`;
  const state = randomUrlToken(18);
  const nonce = randomUrlToken(18);
  const verifier = randomUrlToken(32);
  const challenge = await sha256Base64Url(verifier);

  const authorize = buildAuthorizeUrl({
    redirectUri,
    state,
    nonce,
    codeChallenge: challenge,
  });

  const response = NextResponse.redirect(authorize);
  const cookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: origin.startsWith("https"),
    path: "/",
    maxAge: 600,
  };
  response.cookies.set("sx_oauth_state", state, cookie);
  response.cookies.set("sx_oauth_nonce", nonce, cookie);
  response.cookies.set("sx_oauth_verifier", verifier, cookie);
  return response;
}
