import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { logActivity } from "@/lib/activity-log";
import { setAuthCookies } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { isValidStudentId, normalizeStudentId, studentIdLookupCandidates, STUDENT_ID_FORMAT_HINT } from "@/lib/student-id";
import { AppRole } from "@/types/app";

const staffRoles = new Set<Role>([Role.ADMIN, Role.LECTURER]);

const appRoleFromDb: Record<Role, AppRole | null> = {
  [Role.STUDENT]: "student",
  [Role.LECTURER]: "lecturer",
  [Role.ADMIN]: "admin",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body.password ?? "";
    const portal = body.role as "student" | "staff";

    if (!password || (portal !== "student" && portal !== "staff")) {
      return NextResponse.json({ error: "Password and role are required." }, { status: 400 });
    }

    let user = null;

    if (portal === "student") {
      const normalizedStudentId = normalizeStudentId(body.studentId ?? "");
      if (!isValidStudentId(normalizedStudentId)) {
        return NextResponse.json(
          { error: `Student ID must use the format ${STUDENT_ID_FORMAT_HINT}.`, field: "studentId" },
          { status: 400 }
        );
      }

      const candidates = studentIdLookupCandidates(normalizedStudentId);
      const student = await prisma.student.findFirst({
        where: { studentId: { in: candidates } },
        include: { user: true },
      });

      if (!student?.user) {
        return NextResponse.json(
          { error: "No account found with this student ID.", field: "studentId" },
          { status: 401 }
        );
      }

      user = student.user;
    } else {
      const email = body.email?.trim().toLowerCase();
      if (!email) {
        return NextResponse.json(
          { error: "Email and password are required.", field: "email" },
          { status: 400 }
        );
      }

      user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return NextResponse.json(
          { error: "No account found with this email address.", field: "email" },
          { status: 401 }
        );
      }
    }

    if (!user.isActive) {
      const field = portal === "student" ? "studentId" : "email";
      return NextResponse.json(
        { error: "This account has been deactivated.", field },
        { status: 401 }
      );
    }

    if (portal === "student") {
      if (user.role !== Role.STUDENT) {
        return NextResponse.json(
          {
            error: "This account is not a student account. Use the staff sign-in page instead.",
            field: "studentId",
          },
          { status: 401 }
        );
      }
    } else if (!staffRoles.has(user.role)) {
      return NextResponse.json(
        {
          error: "This account is not authorized for the staff portal. Use the student sign-in page instead.",
          field: "email",
        },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password.", field: "password" }, { status: 401 });
    }

    const loginAt = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: loginAt },
    });

    await logActivity({
      actorId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      summary: `${user.fullName} signed in (${user.role.toLowerCase()})`,
      metadata: {
        role: user.role,
        portal,
        at: loginAt.toISOString(),
      },
    });

    const resolvedRole = appRoleFromDb[user.role];
    if (!resolvedRole) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, role: resolvedRole });
    setAuthCookies(response, user.id, resolvedRole);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
