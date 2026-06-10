import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { sendLecturerInviteEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { mapLecturerToRecord } from "@/lib/lecturer-mapper";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const lecturers = await prisma.lecturer.findMany({
      include: {
        user: true,
        courses: {
          select: {
            courseCode: true,
            department: { select: { departmentName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      lecturers: lecturers.map(mapLecturerToRecord),
    });
  } catch (error) {
    console.error("GET /api/lecturers:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load lecturers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const lecturer = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          role: Role.LECTURER,
          password: passwordHash,
          isActive: true,
        },
      });

      return tx.lecturer.create({
        data: {
          userId: user.id,
          isVerified: true,
        },
        include: {
          user: true,
          courses: {
            select: {
              courseCode: true,
              department: { select: { departmentName: true } },
            },
          },
        },
      });
    });

    const emailResult = await sendLecturerInviteEmail({
      to: normalizedEmail,
      fullName: fullName.trim(),
      temporaryPassword: password,
    });

    const emailSent = emailResult.ok;
    const message = emailSent
      ? "Lecturer account created. An invitation email with the temporary password was sent."
      : "Lecturer account created, but the invitation email could not be sent. Share the temporary password manually.";

    return NextResponse.json(
      {
        message,
        emailSent: emailSent,
        emailError: emailSent ? null : ("error" in emailResult ? emailResult.error : "Email failed"),
        lecturer: mapLecturerToRecord(lecturer),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/lecturers:", error);
    return NextResponse.json({ error: "Failed to create lecturer." }, { status: 500 });
  }
}
