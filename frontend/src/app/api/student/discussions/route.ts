import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { createDiscussionForStudent, listDiscussionsForStudent } from "@/lib/student-discussions-data";
import type { CreateDiscussionInput } from "@/types/student-discussions";

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const view = request.nextUrl.searchParams.get("view") ?? "";
    const courseId = request.nextUrl.searchParams.get("courseId") ?? undefined;
    const search = request.nextUrl.searchParams.get("search") ?? undefined;

    const discussions = await listDiscussionsForStudent(student.userId, {
      view,
      courseId: courseId || undefined,
      search,
    });

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("GET /api/student/discussions:", error);
    return NextResponse.json({ error: "Failed to load discussions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const body = await request.json();
    const input: CreateDiscussionInput = {
      title: body.title ?? "",
      message: body.message ?? "",
      courseId: body.courseId ?? null,
      discussionType: body.discussionType ?? "GENERAL",
    };

    if (!input.title.trim() || !input.message.trim()) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const result = await createDiscussionForStudent(student.userId, input);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.discussion, { status: 201 });
  } catch (error) {
    console.error("POST /api/student/discussions:", error);
    return NextResponse.json({ error: "Failed to create discussion." }, { status: 500 });
  }
}
