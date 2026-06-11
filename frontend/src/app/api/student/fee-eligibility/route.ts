import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getStudentFeeEligibility } from "@/lib/student-fee-guard";

export async function GET() {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const eligibility = await getStudentFeeEligibility(student.id);
    return NextResponse.json(eligibility);
  } catch (error) {
    console.error("GET /api/student/fee-eligibility:", error);
    return NextResponse.json({ error: "Failed to check fee eligibility." }, { status: 500 });
  }
}
