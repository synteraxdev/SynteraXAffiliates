import { NextResponse } from "next/server";
import { flushOutboundPostbacks, releaseHeldConversions } from "@/lib/outbound";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const released = await releaseHeldConversions();
  const outbound = await flushOutboundPostbacks(50);
  return NextResponse.json({ ok: true, released, outbound: outbound.length });
}
