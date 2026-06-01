import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const rows = await prisma.attendance.findMany({
      take: 200,
      orderBy: { markedAt: "desc" },
      include: {
        student: {
          select: {
            studentId: true,
            user: { select: { fullName: true } },
          },
        },
        liveClass: {
          select: {
            course: { select: { courseCode: true } },
            startTime: true,
          },
        },
      },
    });

    const records = rows.map((r) => ({
      id: r.id,
      studentName: r.student?.user.fullName ?? "—",
      studentId: r.student?.studentId ?? "—",
      course: r.liveClass?.course?.courseCode ?? "—",
      date: formatDate(r.markedAt),
      status: r.status,
    }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET /api/admin/attendance:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load attendance." }, { status: 500 });
  }
}
