import { AttendanceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

const validStatuses = new Set<string>(Object.values(AttendanceStatus));

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const statusRaw = typeof body.status === "string" ? body.status.trim().toUpperCase() : "";

    if (!validStatuses.has(statusRaw)) {
      return NextResponse.json({ error: "Invalid attendance status." }, { status: 400 });
    }

    const record = await prisma.attendance.update({
      where: { id },
      data: { status: statusRaw as AttendanceStatus },
      include: {
        student: { select: { studentId: true, user: { select: { fullName: true } } } },
        liveClass: { select: { course: { select: { courseCode: true } } } },
      },
    });

    return NextResponse.json({
      message: "Attendance updated.",
      record: {
        id: record.id,
        studentName: record.student?.user.fullName ?? "—",
        studentId: record.student?.studentId ?? "—",
        course: record.liveClass?.course?.courseCode ?? "General",
        date: formatDate(record.markedAt),
        status: record.status,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/attendance/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update attendance." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    await prisma.attendance.delete({ where: { id } });

    return NextResponse.json({ message: "Attendance record removed." });
  } catch (error) {
    console.error("DELETE /api/admin/attendance/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete attendance." }, { status: 500 });
  }
}
