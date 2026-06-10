import { NextRequest, NextResponse } from "next/server";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { resetPasswordWithOtp } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email ?? "";
    const otp = body.otp ?? "";
    const password = body.password ?? "";

    const result = await resetPasswordWithOtp(email, otp, password);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("POST /api/auth/reset-password:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
