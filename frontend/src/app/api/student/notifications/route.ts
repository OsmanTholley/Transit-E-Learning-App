import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import {
  listActiveNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/student-notifications-service";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const notifications = await listActiveNotifications(user.id);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/student/notifications:", error);
    return NextResponse.json({ error: "Failed to load notices." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const body = await request.json();

    if (body.markAllRead === true) {
      const count = await markAllNotificationsRead(user.id);
      return NextResponse.json({
        message: count > 0 ? "All notices marked as read." : "No unread notices.",
        markedCount: count,
      });
    }

    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Notice id is required." }, { status: 400 });
    }

    const marked = await markNotificationRead(user.id, id);
    if (!marked) {
      return NextResponse.json({ error: "Notice not found or already read." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Notice marked as read. It will be removed after 24 hours.",
    });
  } catch (error) {
    console.error("PATCH /api/student/notifications:", error);
    return NextResponse.json({ error: "Failed to update notice." }, { status: 500 });
  }
}
