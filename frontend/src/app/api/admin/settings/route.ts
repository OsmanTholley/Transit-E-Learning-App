import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getSystemSettings, updateSystemSettings } from "@/lib/system-settings";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/admin/settings:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const updates = body.settings ?? body;

    const settings = await updateSystemSettings(updates, admin.id);

    await logActivity({
      actorId: admin.id,
      action: "settings.updated",
      entityType: "system",
      summary: "System settings updated",
      metadata: { keys: Object.keys(updates) },
    });

    return NextResponse.json({ message: "Settings saved.", settings });
  } catch (error) {
    console.error("PATCH /api/admin/settings:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
