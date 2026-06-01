import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { buildTutorResponse } from "@/lib/student-ai-tutor-engine";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const rows = await prisma.aiChatHistory.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        question: r.question ?? "",
        answer: r.aiResponse ?? "",
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/student/ai-tutor:", error);
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const body = await request.json();
    const question = body.question?.trim();
    const courseTitle = body.courseTitle?.trim();
    const subject = body.subject?.trim();
    const mode = body.mode as "formula" | "diagram" | "revision" | "default" | undefined;

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const answer = buildTutorResponse({
      question,
      courseTitle,
      subject,
      mode: mode ?? "default",
    });

    const row = await prisma.aiChatHistory.create({
      data: {
        studentId: student.id,
        question,
        aiResponse: answer,
      },
    });

    return NextResponse.json({ id: row.id, answer });
  } catch (error) {
    console.error("POST /api/student/ai-tutor:", error);
    return NextResponse.json({ error: "AI Tutor is unavailable." }, { status: 500 });
  }
}
