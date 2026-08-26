import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { recordClick } from "@/lib/data";

function deviceFromUa(ua: string): string {
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ offer: string; ref: string }> },
) {
  const { offer, ref } = await context.params;
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : undefined;

  try {
    const result = await recordClick({
      offerSlug: offer,
      ref,
      origin: process.env.SYNTERAX_PUBLIC_ORIGIN || "https://synterax.io",
      userAgent: ua,
      referer: request.headers.get("referer") || undefined,
      ipHash,
      country: request.headers.get("x-vercel-ip-country") || undefined,
      device: deviceFromUa(ua),
      sub1: url.searchParams.get("sub1") || undefined,
      sub2: url.searchParams.get("sub2") || undefined,
      sub3: url.searchParams.get("sub3") || undefined,
    });
    return NextResponse.redirect(result.destination_url, 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
