import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getValidatedUser } from "@/lib/auth";
import { generateAiAnswer } from "@/lib/ai-chat-service";
import {
  appendAiMessage,
  buildRoleSystemPrompt,
  createAiConversation,
  deleteAiConversation,
  getAiConversation,
  getAiUsage,
  listAiConversations,
  renameAiConversation,
  trackAiUsage,
} from "@/lib/ai-conversation-service";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";
import { prisma } from "@/lib/prisma";

async function getStudentIdForUser(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  return student?.id ?? null;
}

export async function GET(request: NextRequest) {
  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (conversationId) {
    const conversation = await getAiConversation(user.id, conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    const usage = await getAiUsage(user.id);
    return NextResponse.json({ conversation, usage });
  }

  const conversations = await listAiConversations(user.id);
  const usage = await getAiUsage(user.id);
  return NextResponse.json({ conversations, usage });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getValidatedUser(["student", "lecturer", "admin"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "create_conversation") {
      const conversation = await createAiConversation(
        user.id,
        user.role as Role,
        body.title?.trim() || "New Chat",
      );
      return NextResponse.json({ conversation });
    }

    if (action === "rename_conversation") {
      if (!body.conversationId || !body.title?.trim()) {
        return NextResponse.json({ error: "Conversation id and title are required." }, { status: 400 });
      }
      await renameAiConversation(user.id, body.conversationId, body.title);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_conversation") {
      if (!body.conversationId) {
        return NextResponse.json({ error: "Conversation id is required." }, { status: 400 });
      }
      await deleteAiConversation(user.id, body.conversationId);
      return NextResponse.json({ ok: true });
    }

    if (action === "send_message") {
      const question = body.question?.trim();
      if (!question) {
        return NextResponse.json({ error: "Question is required." }, { status: 400 });
      }

      if (user.role === "STUDENT") {
        const studentId = await getStudentIdForUser(user.id);
        if (studentId) {
          const locked = await buildFeeLockResponse(studentId, "general");
          if (locked) return locked;
        }
      }

      let conversationId = body.conversationId as string | undefined;
      if (!conversationId) {
        const created = await createAiConversation(user.id, user.role as Role);
        conversationId = created.id;
      }

      const conversation = await getAiConversation(user.id, conversationId);
      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }

      await appendAiMessage({
        conversationId,
        role: "user",
        content: question,
      });

      const history = conversation.messages.map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));

      const result = await generateAiAnswer({
        question,
        courseTitle: body.courseTitle,
        subject: body.subject,
        mode: body.mode,
        modelProfile: body.modelProfile,
        history,
        systemPrompt: buildRoleSystemPrompt(user.role as Role, body.feature),
      });

      const assistantMessage = await appendAiMessage({
        conversationId,
        role: "assistant",
        content: result.answer,
        tokensUsed: result.tokensUsed ?? 0,
      });

      await trackAiUsage(user.id, result.tokensUsed ?? 0);

      if (conversation.title === "New Chat" && question.length > 0) {
        const autoTitle = question.slice(0, 48) + (question.length > 48 ? "…" : "");
        await renameAiConversation(user.id, conversationId, autoTitle);
      }

      return NextResponse.json({
        conversationId,
        message: {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
        source: result.source,
        model: result.model,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error: unknown) {
    console.error("POST /api/ai/assistant error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
