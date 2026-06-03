import type { AiModelProfileId } from "@/lib/ai-models";
import { chatWithOllama } from "@/lib/ollama-client";
import { buildTutorResponse, type TutorContext } from "@/lib/student-ai-tutor-engine";

export async function generateAiAnswer(ctx: TutorContext & { modelProfile?: AiModelProfileId }) {
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
    };
  } catch (error) {
    console.warn("Ollama unavailable, using offline tutor engine:", error);
    return {
      answer: buildTutorResponse(ctx),
      source: "fallback" as const,
      model: null,
    };
  }
}
