import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const origin = appOrigin(request.url);
  const response = NextResponse.redirect(`${origin}/`, { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
