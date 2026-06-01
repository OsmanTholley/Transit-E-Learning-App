import { NextResponse } from "next/server";
import { getAdminCreatedDepartments } from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const [departments, lecturers] = await Promise.all([
      getAdminCreatedDepartments(),
      prisma.lecturer.findMany({
        where: { user: { isActive: true } },
        orderBy: { user: { fullName: "asc" } },
        select: {
          id: true,
          user: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      departments,
      lecturers: lecturers.map((l) => ({
        id: l.id,
        label: l.user.email ? `${l.user.fullName} (${l.user.email})` : l.user.fullName,
      })),
    });
  } catch (error) {
    console.error("GET /api/lecturers/messages/targets:", error);
    return NextResponse.json({ error: "Failed to load audience options." }, { status: 500 });
  }
}
