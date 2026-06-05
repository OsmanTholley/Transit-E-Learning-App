import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  countUnreadNotifications,
  listActiveNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/student-notifications-service";

export async function GET() {
  try {
    const user = await getValidatedUser();
    if (!user) return unauthorized();

    const notifications = await listActiveNotifications(user.id);
    const unreadCount = await countUnreadNotifications(user.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getValidatedUser();
    if (!user) return unauthorized();

    const body = await request.json();

    if (body.markAllRead === true) {
      const count = await markAllNotificationsRead(user.id);
      return NextResponse.json({
        message: count > 0 ? "All notifications marked as read." : "No unread notifications.",
        markedCount: count,
      });
    }

    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
    }

    const marked = await markNotificationRead(user.id, id);
    if (!marked) {
      return NextResponse.json({ error: "Notification not found or already read." }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("PATCH /api/notifications:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
