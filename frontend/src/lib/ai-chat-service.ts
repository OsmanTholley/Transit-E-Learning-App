import type { AiModelProfileId } from "@/lib/ai-models";
import { chatWithOpenAi, isOpenAiConfigured } from "@/lib/openai-client";
import { chatWithOllama } from "@/lib/ollama-client";
import { buildTutorResponse, type TutorContext } from "@/lib/student-ai-tutor-engine";

export async function generateAiAnswer(
  ctx: TutorContext & {
    modelProfile?: AiModelProfileId;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    systemPrompt?: string;
  },
) {
  if (isOpenAiConfigured()) {
    try {
      const historyMessages = (ctx.history ?? []).map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const openai = await chatWithOpenAi({
        modelProfile: ctx.modelProfile,
        systemPrompt:
          ctx.systemPrompt ??
          `You are Transit AI Assistant. Course: ${ctx.courseTitle ?? "General"}. Subject: ${ctx.subject ?? "General"}.`,
        messages: [...historyMessages, { role: "user" as const, content: ctx.question }],
      });
      return {
        answer: openai.answer,
        source: "openai" as const,
        model: openai.model,
        tokensUsed: openai.tokensUsed,
      };
    } catch (error: unknown) {
      console.error("OpenAI error caught in generateAiAnswer:", error);
      const apiError = error as { status?: number; code?: string; message?: string };
      const isQuota =
        apiError.status === 429 ||
        apiError.code === "insufficient_quota" ||
        String(apiError.message).includes("quota");
      const isAuth =
        apiError.status === 401 ||
        apiError.code === "invalid_api_key" ||
        String(apiError.message).includes("API key");
      if (isQuota) {
        throw new Error("OpenAI API Quota Exceeded. Please check billing or plan.");
      }
      if (isAuth) {
        throw new Error("Invalid OpenAI API Key. Please verify configuration.");
      }
      throw new Error(error instanceof Error ? error.message : "OpenAI API Error");
    }
  }

  try {
    const ollama = await chatWithOllama({
      question: ctx.question,
      modelProfile: ctx.modelProfile,
      courseTitle: ctx.courseTitle,
      subject: ctx.subject,
    });
    return {
      answer: ollama.answer,
      source: "ollama" as const,
      model: ollama.model,
      tokensUsed: 0,
    };
  } catch (error) {
    console.warn("Ollama unavailable, using offline tutor engine:", error);
    return {
      answer: buildTutorResponse(ctx),
      source: "fallback" as const,
      model: null,
      tokensUsed: 0,
    };
  }
}
