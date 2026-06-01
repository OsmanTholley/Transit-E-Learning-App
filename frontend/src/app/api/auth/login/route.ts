import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { setAuthCookies } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { isValidStudentId, normalizeStudentId } from "@/lib/student-id";
import { AppRole } from "@/types/app";

const roleMap: Record<AppRole, Role> = {
  student: Role.STUDENT,
  lecturer: Role.LECTURER,
  admin: Role.ADMIN,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body.password ?? "";
    const role = body.role as AppRole;

    if (!password || !roleMap[role]) {
      return NextResponse.json({ error: "Password and role are required." }, { status: 400 });
    }

    let user = null;

    if (role === "student") {
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

    if (user.role !== roleMap[role]) {
      return NextResponse.json({ error: "Invalid credentials for the selected role." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, role });
    setAuthCookies(response, user.id, role);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
