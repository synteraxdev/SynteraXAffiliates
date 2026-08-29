import { NextResponse } from "next/server";
import { recordConversionFromClick, recordPostback, recordTrackingEvent } from "@/lib/data";
import { normalizeTrackingEvent } from "@/lib/js-track";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clickId = url.searchParams.get("sx_click") || url.searchParams.get("click_id");
  const secret = url.searchParams.get("secret");
  const offer = url.searchParams.get("offer") || undefined;

  try {
    const rawType = url.searchParams.get("type") || url.searchParams.get("event");
    if (secret) {
      await recordPostback({
        offer,
        secret,
        clickId: clickId || undefined,
        ref: url.searchParams.get("ref") || undefined,
        externalId: url.searchParams.get("external_id") || undefined,
        amountUsd: Number(url.searchParams.get("amount") || 0),
        status: url.searchParams.get("status") || "pending",
        conversionType: rawType ? normalizeTrackingEvent(rawType) : undefined,
      });
    } else if (clickId && rawType) {
      await recordTrackingEvent({
        eventType: normalizeTrackingEvent(rawType),
        clickId,
        externalId: url.searchParams.get("external_id") || undefined,
        amountUsd: Number(url.searchParams.get("amount") || 0),
        source: "pixel",
      });
    } else if (clickId) {
      await recordConversionFromClick({
        clickId,
        conversionType: "pixel",
        externalId: url.searchParams.get("external_id") || undefined,
        amountUsd: Number(url.searchParams.get("amount") || 0),
      });
    }
  } catch {
    // Pixel fires must not break the advertiser page.
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
