import { NextResponse } from "next/server";
import { recordConversionFromClick } from "@/lib/data";
import { parseTrackingBody, parseTrackingFields, trackingCorsHeaders } from "@/lib/js-track";
import { flushOutboundPostbacks } from "@/lib/outbound";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...trackingCorsHeaders(),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  let body: Record<string, string> = {};
  if (request.method === "POST") {
    try {
      body = parseTrackingBody(await request.text(), request.headers.get("content-type") || "");
    } catch {
      return json({ ok: false, error: "invalid_body" }, 400);
    }
  }

  const payload = parseTrackingFields({ ...query, ...body });
  if (!payload.clickId) return json({ ok: false, error: "missing_click" }, 400);

  try {
    const result = await recordConversionFromClick({
      clickId: payload.clickId,
      conversionType: payload.type || "js",
      externalId: payload.externalId,
      amountUsd: payload.amountUsd,
      metadata: {
        source: "js",
        offer: payload.offer || null,
        ref: payload.ref || null,
        status: payload.status,
      },
    });
    await flushOutboundPostbacks();
    return json({ ok: true, ...(result && typeof result === "object" ? result : { result }) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "convert_failed";
    return json({ ok: false, error: message }, 400);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: trackingCorsHeaders() });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
