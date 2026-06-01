import { normalizeAcademicYear } from "@/lib/academic-years";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { mapStudentToRecord } from "@/lib/student-mapper";
import { isValidStudentId, normalizeStudentId } from "@/lib/student-id";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const students = await prisma.student.findMany({
      include: {
        user: true,
        department: true,
        program: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      students: students.map(mapStudentToRecord),
    });
  } catch (error) {
    console.error("GET /api/students:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load students." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const {
      fullName,
      studentId,
      email,
      phone,
      password,
      departmentName,
      programName,
      year,
      semester,
      admissionYear,
    } = body;

    if (!fullName?.trim() || !studentId?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Full name, student ID, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const normalizedStudentId = normalizeStudentId(studentId);
    if (!isValidStudentId(normalizedStudentId)) {
      return NextResponse.json(
        { error: "Student ID must use the format TCSL/001 (TCSL/ followed by at least 3 digits)." },
        { status: 400 }
      );
    }

    const existingStudentId = await prisma.student.findUnique({
      where: { studentId: normalizedStudentId },
    });
    if (existingStudentId) {
      return NextResponse.json({ error: "Student ID already exists." }, { status: 409 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    let departmentId: string | null = null;
    if (departmentName?.trim()) {
      const department = await prisma.department.findFirst({
        where: { departmentName: departmentName.trim() },
      });
      if (!department) {
        return NextResponse.json({ error: "Department not found." }, { status: 400 });
      }
      departmentId = department.id;
    }

    let programId: string | null = null;
    if (programName?.trim()) {
      const program = await prisma.program.findFirst({
        where: {
          programName: programName.trim(),
          ...(departmentId ? { departmentId } : {}),
        },
      });
      if (!program) {
        return NextResponse.json({ error: "Program not found for this department." }, { status: 400 });
      }
      programId = program.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          role: Role.STUDENT,
          password: passwordHash,
          isActive: true,
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          studentId: normalizedStudentId,
          departmentId,
          programId,
          level: normalizeAcademicYear(year),
          semester: semester?.trim() || null,
          admissionYear: admissionYear?.trim() || null,
        },
        include: {
          user: true,
          department: true,
          program: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Student created successfully.",
        student: mapStudentToRecord(student),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/students:", error);
    return NextResponse.json({ error: "Failed to create student." }, { status: 500 });
  }
}
