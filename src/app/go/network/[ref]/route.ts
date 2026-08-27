import { NextResponse } from "next/server";
import { trackSmartlink } from "@/lib/tracking";

export async function GET(
  request: Request,
  context: { params: Promise<{ ref: string }> },
) {
  const { ref } = await context.params;
  try {
    return await trackSmartlink(request, ref);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Smartlink failed";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
