import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { processDueFeeReminders } from "@/lib/finance-service";

export async function POST() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sent = await processDueFeeReminders();
  return NextResponse.json({ ok: true, sent });
}
