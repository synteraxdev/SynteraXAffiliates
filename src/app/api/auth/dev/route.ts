import { NextResponse } from "next/server";
import { appOrigin, devLoginEnabled } from "@/lib/env";
import { upsertSsoProfile } from "@/lib/data";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  if (!devLoginEnabled()) {
    return NextResponse.json({ error: "Dev login disabled" }, { status: 404 });
  }

  const form = await request.formData();
  const role = String(form.get("role") || "distributor");
  const id = role === "admin" ? "00000000-0000-4000-8000-000000000001" : "00000000-0000-4000-8000-000000000002";
  const user = await upsertSsoProfile({
    id,
    email: role === "admin" ? "admin@synterax.io" : "affiliate@synterax.io",
    username: role === "admin" ? "sxadmin" : "sxaffiliate",
    name: role === "admin" ? "SynteraX Admin" : "SynteraX Affiliate",
    role: role === "admin" ? "admin" : "distributor",
    status: "active",
  });

  const token = await createSessionToken(user);
  const origin = appOrigin(request.url);
  const response = NextResponse.redirect(`${origin}/dashboard`, { status: 303 });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
