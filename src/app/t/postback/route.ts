import { NextResponse } from "next/server";
import { recordPostback } from "@/lib/data";
import { flushOutboundPostbacks } from "@/lib/outbound";

function pick(source: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value?.trim()) return value.trim();
  }
  return undefined;
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  let body: Record<string, string> = {};
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const parsed = await request.json();
        body = Object.fromEntries(
          Object.entries(parsed || {}).map(([key, value]) => [key, String(value ?? "")]),
        );
      } else {
        const text = await request.text();
        body = Object.fromEntries(new URLSearchParams(text).entries());
      }
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }
  }

  const merged = { ...query, ...body };
  const secret = pick(merged, ["secret", "p_secret"]);
  if (!secret) return NextResponse.json({ ok: false, error: "secret_required" }, { status: 400 });

  try {
    const result = await recordPostback({
      offer: pick(merged, ["offer", "offer_slug", "p_offer_slug"]),
      secret,
      clickId: pick(merged, ["click_id", "sx_click", "p_click_id"]),
      ref: pick(merged, ["ref", "ref_slug", "p_ref_slug"]),
      externalId: pick(merged, ["external_id", "txn_id", "order_id"]),
      amountUsd: Number(pick(merged, ["amount", "amount_usd", "payout"]) || 0),
      status: pick(merged, ["status"]) || "pending",
      coupon: pick(merged, ["coupon", "coupon_code", "p_coupon"]),
    });
    await flushOutboundPostbacks();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "postback_failed";
    const status = message.includes("Invalid postback secret") ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
