import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROLE_COOKIE, AUTH_USER_COOKIE, isAppRole } from "@/lib/auth-constants";

const rolePrefixes = ["student", "lecturer", "admin"] as const;

const publicPages = ["/", "/login", "/register", "/forgot-password"];

const publicApiPaths = new Set([
  "/api/auth/login",
  "/api/auth/register/verify-id",
  "/api/auth/register/complete",
]);

function isPublicPage(pathname: string) {
  return publicPages.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function apiUnauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function apiForbidden() {
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
  const userId = request.cookies.get(AUTH_USER_COOKIE)?.value;
  const hasSession = Boolean(userId && isAppRole(role));

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/auth/logout" || publicApiPaths.has(pathname)) {
      return NextResponse.next();
    }

    if (!hasSession) {
      return apiUnauthorized();
    }

    if (pathname.startsWith("/api/student/")) {
      if (role !== "student") return apiForbidden();
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/students") || pathname.startsWith("/api/lecturers")) {
      if (role !== "admin") return apiForbidden();
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  if (isPublicPage(pathname)) {
    if (hasSession && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }
    return NextResponse.next();
  }

  const matchedPrefix = rolePrefixes.find((prefix) => pathname.startsWith(`/${prefix}`));
  if (!matchedPrefix) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const portal = matchedPrefix === "student" ? "student" : "staff";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("role", portal);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== matchedPrefix) {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
