import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { clearActivityLogs, countActivityLogsByAction, listActivityLogs } from "@/lib/activity-log";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const action = request.nextUrl.searchParams.get("action");
    const [logs, actionCounts] = await Promise.all([
      listActivityLogs({
        limit: Math.min(Math.max(limit, 1), 200),
        action: action || null,
      }),
      countActivityLogsByAction(),
    ]);

    return NextResponse.json({ logs, actionCounts });
  } catch (error) {
    console.error("GET /api/admin/activity-logs:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load activity logs." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    await clearActivityLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/activity-logs:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to clear activity logs." }, { status: 500 });
  }
}
