import { NextRequest, NextResponse } from "next/server";
import type { AiModelProfileId } from "@/lib/ai-models";
import { generateAiAnswer } from "@/lib/ai-chat-service";
import { getValidatedUser, unauthorized } from "@/lib/auth";
import type { AppRole } from "@/types/app";

type AiChatBody = {
  question?: string;
  courseTitle?: string;
  subject?: string;
  mode?: "formula" | "diagram" | "revision" | "default";
  modelProfile?: AiModelProfileId;
};

export async function handleAiChatPost(request: NextRequest, allowedRoles: AppRole[]) {
  const user = await getValidatedUser(allowedRoles);
  if (!user) {
    return unauthorized();
  }

  const body = (await request.json()) as AiChatBody;
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  try {
    const result = await generateAiAnswer({
      question,
      courseTitle: body.courseTitle?.trim(),
      subject: body.subject?.trim(),
      mode: body.mode ?? "default",
      modelProfile: body.modelProfile,
    });

    return NextResponse.json({
      id: crypto.randomUUID(),
      answer: result.answer,
      source: result.source,
      model: result.model,
    });
  } catch (error: unknown) {
    console.error("AI Chat Route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
