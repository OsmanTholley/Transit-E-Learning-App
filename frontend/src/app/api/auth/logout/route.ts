import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { clearAuthCookies, getValidatedUser } from "@/lib/auth";

export async function POST() {
  const user = await getValidatedUser();
  if (user) {
    await logActivity({
      actorId: user.id,
      action: "auth.logout",
      entityType: "user",
      entityId: user.id,
      summary: `${user.fullName} signed out`,
      metadata: { role: user.role, at: new Date().toISOString() },
    });
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
