import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { findAdmittedStudentForRegistration } from "@/lib/admitted-student";
import { syncEnrollmentsForStudents } from "@/lib/course-enrollment";
import { prisma } from "@/lib/prisma";
import { setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, email, phone, password, confirmPassword } = body;

    if (!studentId?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Student ID, email, and password are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const verify = await findAdmittedStudentForRegistration(studentId);
    if ("error" in verify) {
      return NextResponse.json({ error: verify.error }, { status: 400 });
    }

    const { admitted, normalizedStudentId } = verify;

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { user, createdStudentId } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName: admitted.fullName,
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          role: Role.STUDENT,
          password: passwordHash,
          isActive: true,
        },
      });

      const createdStudent = await tx.student.create({
        data: {
          userId: createdUser.id,
          studentId: normalizedStudentId,
          departmentId: admitted.departmentId,
          programId: admitted.programId,
          level: admitted.level,
          semester: admitted.semester,
          admissionYear: admitted.admissionYear,
        },
      });

      await tx.admittedStudent.update({
        where: { id: admitted.id },
        data: { registeredAt: new Date() },
      });

      return { user: createdUser, createdStudentId: createdStudent.id };
    });

    await syncEnrollmentsForStudents([createdStudentId]);

    const response = NextResponse.json({
      ok: true,
      message: "Registration successful. Welcome to Transit College S/L E-Learning!",
    });

    setAuthCookies(response, user.id, "student");

    return response;
  } catch (error) {
    console.error("POST /api/auth/register/complete:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
