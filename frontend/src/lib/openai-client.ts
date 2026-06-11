import OpenAI from "openai";
import type { AiModelProfileId } from "@/lib/ai-models";
import { getAiModelProfile } from "@/lib/ai-models";

const MODEL_MAP: Record<AiModelProfileId, string> = {
  light: "gpt-4o-mini",
  science: "gpt-4o-mini",
  powerful: "gpt-4o",
};

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

export type OpenAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatWithOpenAi(params: {
  messages: OpenAiChatMessage[];
  modelProfile?: AiModelProfileId;
  systemPrompt?: string;
}) {
  const client = getClient();
  const profile = getAiModelProfile(params.modelProfile);
  const model = MODEL_MAP[profile.id];

  const messages: OpenAiChatMessage[] = params.systemPrompt
    ? [{ role: "system", content: params.systemPrompt }, ...params.messages]
    : params.messages;

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: profile.id === "science" ? 0.3 : 0.7,
    max_tokens: profile.id === "powerful" ? 4096 : 2048,
  });

  const choice = completion.choices[0];
  const answer = choice?.message?.content?.trim() ?? "";
  const tokensUsed = completion.usage?.total_tokens ?? 0;

  return {
    answer,
    model,
    tokensUsed,
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
  };
}
