import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validateStudentSession, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const body = await request.json();
    const currentPassword = body.currentPassword?.trim();
    const newPassword = body.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    return NextResponse.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("POST /api/student/profile/password:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to change password." }, { status: 500 });
  }
}
