import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activity-log";
import { setAuthCookies } from "@/lib/auth";
import {
  exchangeGoogleCode,
  getGoogleOAuthConfig,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/google-oauth";
import { getAppBaseUrl } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/types/app";

const staffRoles = new Set<Role>([Role.ADMIN, Role.LECTURER]);

const appRoleFromDb: Record<Role, AppRole | null> = {
  [Role.STUDENT]: "student",
  [Role.LECTURER]: "lecturer",
  [Role.ADMIN]: "admin",
};

function loginErrorRedirect(message: string) {
  const url = new URL("/login", getAppBaseUrl());
  url.searchParams.set("role", "staff");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig(request.nextUrl.origin);
  if (!config) {
    return loginErrorRedirect("Google sign-in is not configured.");
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return loginErrorRedirect("Google sign-in was cancelled.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return loginErrorRedirect("Invalid Google sign-in session. Please try again.");
  }

  const profile = await exchangeGoogleCode(config, code);
  if (!profile?.email) {
    return loginErrorRedirect("Could not verify your Google account.");
  }

  if (!profile.verified_email) {
    return loginErrorRedirect("Your Google email is not verified.");
  }

  const email = profile.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return loginErrorRedirect("No staff account is linked to this Google email.");
  }

  if (!user.isActive) {
    return loginErrorRedirect("This account has been deactivated.");
  }

  if (!staffRoles.has(user.role)) {
    return loginErrorRedirect("This Google account is not authorized for the staff portal.");
  }

  const loginAt = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: loginAt },
  });

  await logActivity({
    actorId: user.id,
    action: "auth.google_login",
    entityType: "user",
    entityId: user.id,
    summary: `${user.fullName} signed in with Google (${user.role.toLowerCase()})`,
    metadata: {
      role: user.role,
      email,
      at: loginAt.toISOString(),
    },
  });

  const resolvedRole = appRoleFromDb[user.role];
  if (!resolvedRole) {
    return loginErrorRedirect("Invalid staff account.");
  }

  const response = NextResponse.redirect(new URL(`/${resolvedRole}/dashboard`, getAppBaseUrl()));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  setAuthCookies(response, user.id, resolvedRole);
  return response;
}
