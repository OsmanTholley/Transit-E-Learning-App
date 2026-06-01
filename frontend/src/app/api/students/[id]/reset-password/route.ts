import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { resetStudentPassword } from "@/lib/student-update";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password?.trim()) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const result = await resetStudentPassword(id, password.trim());
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("POST /api/students/[id]/reset-password:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
