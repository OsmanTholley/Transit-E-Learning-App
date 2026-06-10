import { NextRequest, NextResponse } from "next/server";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { requestPasswordReset } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email ?? "";

    const result = await requestPasswordReset(email);

    if ("error" in result && result.error) {
      const status = result.error.includes("not available") ? 503 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ message: result.message, email: result.email });
  } catch (error) {
    console.error("POST /api/auth/forgot-password:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Unable to process request." }, { status: 500 });
  }
}
