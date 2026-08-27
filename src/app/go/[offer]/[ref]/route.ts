import { NextResponse } from "next/server";
import { trackClick } from "@/lib/tracking";

export async function GET(
  request: Request,
  context: { params: Promise<{ offer: string; ref: string }> },
) {
  const { offer, ref } = await context.params;
  try {
    return await trackClick(request, offer, ref);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
