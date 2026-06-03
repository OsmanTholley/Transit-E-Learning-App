import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { setAuthCookies } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { isValidStudentId, normalizeStudentId } from "@/lib/student-id";
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
          { error: "Student ID must use the format TCSL/001." },
          { status: 400 }
        );
      }

      const student = await prisma.student.findUnique({
        where: { studentId: normalizedStudentId },
        include: { user: true },
      });

      user = student?.user ?? null;
    } else {
      const email = body.email?.trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (portal === "student") {
      if (user.role !== Role.STUDENT) {
        return NextResponse.json({ error: "Invalid credentials for the selected role." }, { status: 401 });
      }
    } else if (!staffRoles.has(user.role)) {
      return NextResponse.json({ error: "Invalid credentials for the selected role." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

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
