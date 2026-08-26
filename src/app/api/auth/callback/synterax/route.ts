import { NextResponse } from "next/server";
import { appOrigin, isProduction } from "@/lib/env";
import { exchangeAuthorizationCode, verifyIdToken } from "@/lib/oidc";
import { upsertSsoProfile } from "@/lib/data";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );

  if (!code || !state || state !== cookies.sx_oauth_state) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      code,
      redirectUri: `${origin}/api/auth/callback/synterax`,
      codeVerifier: cookies.sx_oauth_verifier,
    });
    const claims = await verifyIdToken(tokens.id_token, cookies.sx_oauth_nonce);
    const user = await upsertSsoProfile({
      id: String(claims.sub),
      email: (claims.email as string) || null,
      username: (claims.preferred_username as string) || null,
      name: (claims.name as string) || null,
      role: (claims.role as string) || "distributor",
      status: (claims.status as string) || "active",
    });

    if (user.status !== "active") {
      return NextResponse.redirect(`${origin}/login?error=inactive`);
    }

    const token = await createSessionToken(user);
    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction() || origin.startsWith("https"),
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    response.cookies.set("sx_oauth_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("sx_oauth_nonce", "", { path: "/", maxAge: 0 });
    response.cookies.set("sx_oauth_verifier", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "sso_failed";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }
}
