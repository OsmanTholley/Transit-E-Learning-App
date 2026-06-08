import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleRouteDatabaseError } from "@/lib/db-errors";

function formatDateTime(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 16);
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const [total, unread, recent] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true, role: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: { total, unread, read: total - unread },
      notifications: recent.map((n) => ({
        id: n.id,
        title: n.title ?? "—",
        message: n.message ?? "",
        isRead: n.isRead,
        userName: n.user?.fullName ?? "System",
        userEmail: n.user?.email ?? "—",
        userRole: n.user?.role ?? "—",
        createdAt: formatDateTime(n.createdAt),
        readAt: n.readAt ? formatDateTime(n.readAt) : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/notifications:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}
