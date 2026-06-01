import { NextResponse } from "next/server";
import type { Role, User } from "@prisma/client";
import { AUTH_ROLE_COOKIE, AUTH_USER_COOKIE, isAppRole } from "@/lib/auth-constants";
import { getSessionRole, getSessionUserId } from "@/lib/auth-session";
import { DatabaseUnavailableError, toDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/types/app";

export { DatabaseUnavailableError };

export { AUTH_ROLE_COOKIE, AUTH_USER_COOKIE, isAppRole };

export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24;

const ROLE_TO_APP: Record<Role, AppRole> = {
  STUDENT: "student",
  LECTURER: "lecturer",
  ADMIN: "admin",
};

export function authCookieOptions() {
  return {
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}

export function setAuthCookies(response: NextResponse, userId: string, role: AppRole) {
  const options = authCookieOptions();
  response.cookies.set(AUTH_ROLE_COOKIE, role, options);
  response.cookies.set(AUTH_USER_COOKIE, userId, options);
}

export function clearAuthCookies(response: NextResponse) {
  const options = {
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  response.cookies.set(AUTH_ROLE_COOKIE, "", options);
  response.cookies.set(AUTH_USER_COOKIE, "", options);
}

export function unauthorized(message = "Unauthorized.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Validates cookies against the database (active user, role matches cookie). */
export async function getValidatedUser(allowedRoles?: AppRole[]): Promise<User | null> {
  const userId = await getSessionUserId();
  const cookieRole = await getSessionRole();

  if (!userId || !isAppRole(cookieRole)) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) {
      return null;
    }

    const dbRole = ROLE_TO_APP[user.role];
    if (dbRole !== cookieRole) {
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(dbRole)) {
      return null;
    }

    return user;
  } catch (error) {
    const dbError = toDatabaseError(error);
    if (dbError) throw dbError;
    throw error;
  }
}

export async function requireAdminUser() {
  return getValidatedUser(["admin"]);
}

export async function requireLecturerUser() {
  return getValidatedUser(["lecturer"]);
}

export async function validateStudentSession() {
  return getValidatedUser(["student"]);
}

export async function requireStudent() {
  const user = await validateStudentSession();
  if (!user) {
    return null;
  }

  try {
    return await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        department: true,
        program: true,
        submissions: { select: { assignmentId: true, grade: true, feedback: true, submittedAt: true } },
        quizAttempts: { select: { quizId: true, score: true, submittedAt: true } },
      },
    });
  } catch (error) {
    const dbError = toDatabaseError(error);
    if (dbError) throw dbError;
    throw error;
  }
}

export async function requireLecturer() {
  const user = await requireLecturerUser();
  if (!user) {
    return null;
  }

  try {
    return await prisma.lecturer.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        courses: { select: { courseCode: true } },
      },
    });
  } catch (error) {
    const dbError = toDatabaseError(error);
    if (dbError) throw dbError;
    throw error;
  }
}
