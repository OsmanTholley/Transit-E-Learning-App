import { getAiModelProfile, type AiModelProfileId } from "@/lib/ai-models";

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

export function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL).replace(/\/$/, "");
}

type OllamaMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatWithOllama(options: {
  question: string;
  modelProfile?: AiModelProfileId;
  systemPrompt?: string;
  courseTitle?: string;
  subject?: string;
}): Promise<{ answer: string; model: string; source: "ollama" }> {
  const profile = getAiModelProfile(options.modelProfile);
  const system =
    options.systemPrompt ??
    [
      "You are Transit College S/L E-Learning AI, a patient academic tutor for college students in Sierra Leone.",
      "Explain concepts clearly with definitions, examples, and step-by-step reasoning when helpful.",
      "Use markdown headings and bullet lists. Never fabricate grades or official policy.",
      options.subject ? `Subject focus: ${options.subject}.` : "",
      options.courseTitle ? `Course context: ${options.courseTitle}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

  const messages: OllamaMessage[] = [
    { role: "system", content: system },
    { role: "user", content: options.question },
  ];

  const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: profile.model,
      messages,
      stream: false,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Ollama request failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const json = (await res.json()) as { message?: { content?: string } };
  const answer = json.message?.content?.trim();
  if (!answer) {
    throw new Error("Ollama returned an empty response.");
  }

  return { answer, model: profile.model, source: "ollama" };
}
