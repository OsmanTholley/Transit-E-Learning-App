import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");
  if (role !== "staff") {
    return NextResponse.json({ error: "Google sign-in is only available for staff." }, { status: 400 });
  }

  const config = getGoogleOAuthConfig(request.nextUrl.origin);
  if (!config) {
    return NextResponse.json(
      { error: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 },
    );
  }

  const state = createOAuthState();
  const response = NextResponse.redirect(buildGoogleAuthUrl(config, state));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
