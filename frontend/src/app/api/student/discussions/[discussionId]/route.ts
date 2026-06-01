import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { addCommentToDiscussion, getDiscussionForStudent } from "@/lib/student-discussions-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const { discussionId } = await params;
    const discussion = await getDiscussionForStudent(student.userId, discussionId);
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
    }

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("GET /api/student/discussions/[discussionId]:", error);
    return NextResponse.json({ error: "Failed to load discussion." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const { discussionId } = await params;
    const body = await request.json();
    const comment = body.comment?.trim();
    if (!comment) {
      return NextResponse.json({ error: "Comment is required." }, { status: 400 });
    }

    const result = await addCommentToDiscussion(student.userId, discussionId, comment);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/student/discussions/[discussionId]:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
