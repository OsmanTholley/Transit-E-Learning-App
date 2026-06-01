import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { mapLecturerToRecord } from "@/lib/lecturer-mapper";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    return NextResponse.json({ lecturer: mapLecturerToRecord(lecturer) });
  } catch (error) {
    console.error("GET /api/lecturer/profile:", error);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = await request.json();
    const { fullName, phone, specialization } = body;

    if (fullName !== undefined && !fullName?.trim()) {
      return NextResponse.json({ error: "Full name cannot be empty." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (fullName?.trim() || phone !== undefined) {
        await tx.user.update({
          where: { id: lecturer.userId },
          data: {
            ...(fullName?.trim() ? { fullName: fullName.trim() } : {}),
            ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
          },
        });
      }

      if (specialization !== undefined) {
        await tx.lecturer.update({
          where: { id: lecturer.id },
          data: { specialization: specialization?.trim() || null },
        });
      }

      return tx.lecturer.findUniqueOrThrow({
        where: { id: lecturer.id },
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

    return NextResponse.json({
      message: "Profile updated successfully.",
      lecturer: mapLecturerToRecord(updated),
    });
  } catch (error) {
    console.error("PATCH /api/lecturer/profile:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
