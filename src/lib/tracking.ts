import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { recordClick, resolveSmartlink, type ClickResult } from "@/lib/data";
import { visitorCookieValue } from "@/lib/network";

export function deviceFromUa(ua: string): string {
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

export function clickContext(request: Request) {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  const cookies = request.headers.get("cookie") || "";
  const existing = /(?:^|;\s*)sx_vid=([^;]+)/.exec(cookies)?.[1];
  return {
    url,
    ua,
    ipHash: ip ? createHash("sha256").update(ip).digest("hex") : undefined,
    country: request.headers.get("x-vercel-ip-country") || undefined,
    device: deviceFromUa(ua),
    visitorId: visitorCookieValue(existing),
    referer: request.headers.get("referer") || undefined,
  };
}

export function blockedRedirect(request: Request, result: Extract<ClickResult, { ok: false }>, ref: string) {
  const dest = new URL("/blocked", request.url);
  dest.searchParams.set("reason", result.reason);
  if (result.offer_slug) dest.searchParams.set("offer", result.offer_slug);
  dest.searchParams.set("ref", ref);
  if (result.country) dest.searchParams.set("country", result.country);
  dest.searchParams.set("network", `/go/network/${encodeURIComponent(ref)}`);
  return NextResponse.redirect(dest, 302);
}

export function withVisitorCookie(response: NextResponse, visitorId: string) {
  response.cookies.set("sx_vid", visitorId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
    secure: true,
  });
  return response;
}

export async function trackClick(request: Request, offerSlug: string, ref: string) {
  const ctx = clickContext(request);
  const result = await recordClick({
    offerSlug,
    ref,
    origin: process.env.SYNTERAX_PUBLIC_ORIGIN || "https://synterax.io",
    userAgent: ctx.ua,
    referer: ctx.referer,
    ipHash: ctx.ipHash,
    country: ctx.country,
    device: ctx.device,
    sub1: ctx.url.searchParams.get("sub1") || undefined,
    sub2: ctx.url.searchParams.get("sub2") || undefined,
    sub3: ctx.url.searchParams.get("sub3") || undefined,
    visitorId: ctx.visitorId,
  });
  if (!result.ok) {
    return withVisitorCookie(blockedRedirect(request, result, ref), ctx.visitorId);
  }
  return withVisitorCookie(NextResponse.redirect(result.destination_url, 302), ctx.visitorId);
}

export async function trackSmartlink(request: Request, ref: string) {
  const ctx = clickContext(request);
  const picked = await resolveSmartlink({ ref, country: ctx.country, device: ctx.device });
  return trackClick(request, picked.offer_slug, ref);
}
