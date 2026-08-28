import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/env";
import { buildTrackerScript, trackingCorsHeaders } from "@/lib/js-track";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = appOrigin(request.url);
  return new NextResponse(buildTrackerScript(origin), {
    headers: {
      ...trackingCorsHeaders(),
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
