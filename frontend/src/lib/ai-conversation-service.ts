import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listAiConversations(userId: string) {
  return prisma.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });
}

export async function getAiConversation(userId: string, conversationId: string) {
  return prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createAiConversation(userId: string, role: Role, title = "New Chat") {
  return prisma.aiConversation.create({
    data: { userId, role, title },
  });
}

export async function renameAiConversation(userId: string, conversationId: string, title: string) {
  return prisma.aiConversation.updateMany({
    where: { id: conversationId, userId },
    data: { title: title.trim() || "New Chat" },
  });
}

export async function deleteAiConversation(userId: string, conversationId: string) {
  return prisma.aiConversation.deleteMany({
    where: { id: conversationId, userId },
  });
}

export async function appendAiMessage(params: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokensUsed?: number;
}) {
  const [message] = await prisma.$transaction([
    prisma.aiConversationMessage.create({
      data: {
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        tokensUsed: params.tokensUsed ?? 0,
      },
    }),
    prisma.aiConversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return message;
}

export async function trackAiUsage(userId: string, tokensUsed: number) {
  await prisma.aiUsageStat.upsert({
    where: { userId },
    create: {
      userId,
      messagesUsed: 1,
      totalTokensUsed: tokensUsed,
      lastUsageAt: new Date(),
    },
    update: {
      messagesUsed: { increment: 1 },
      totalTokensUsed: { increment: tokensUsed },
      lastUsageAt: new Date(),
    },
  });
}

export async function getAiUsage(userId: string) {
  return prisma.aiUsageStat.findUnique({ where: { userId } });
}

export function buildRoleSystemPrompt(role: Role, feature?: string): string {
  const base =
    "You are Transit AI Assistant for an e-learning platform. Be clear, accurate, and supportive.";

  if (role === "STUDENT") {
    return `${base} Help students with academic questions, course explanations, note summaries, study guides, and assignment guidance. Feature context: ${feature ?? "general tutoring"}.`;
  }
  if (role === "LECTURER") {
    return `${base} Help lecturers generate quizzes, exams, lesson plans, lecture summaries, and assignments. Feature context: ${feature ?? "teaching assistant"}.`;
  }
  return `${base} Help admins draft announcements, generate reports, create notices, and summarize operational data. Feature context: ${feature ?? "admin assistant"}.`;
}
