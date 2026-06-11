import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { searchStudentContent } from "@/lib/student-search";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const locked = await buildFeeLockResponse(student.id, "general");
    if (locked) return locked;

    const q = request.nextUrl.searchParams.get("q") ?? "";
    const results = await searchStudentContent(student, q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("GET /api/student/search:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
