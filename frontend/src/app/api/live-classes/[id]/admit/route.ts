import { NextRequest, NextResponse } from "next/server";
import { requireLecturer } from "@/lib/auth";
import { approveLateAdmission, listLateAdmissionCandidates } from "@/lib/live-class-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const lecturer = await requireLecturer();
  if (!lecturer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const students = await listLateAdmissionCandidates(id, lecturer.id);
    return NextResponse.json({ students });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load students.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const lecturer = await requireLecturer();
  if (!lecturer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  try {
    await approveLateAdmission(id, lecturer.id, body.studentId as string);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to admit student.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
