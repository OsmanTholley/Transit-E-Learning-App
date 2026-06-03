export type AiModelProfileId = "light" | "science" | "powerful";

export type AiModelProfile = {
  id: AiModelProfileId;
  label: string;
  description: string;
  model: string;
  hint: string;
};

export const AI_MODEL_PROFILES: AiModelProfile[] = [
  {
    id: "light",
    label: "Lightweight",
    description: "Average student laptops",
    model: "gemma4:e4b",
    hint: "ollama run gemma4:e4b",
  },
  {
    id: "science",
    label: "Science & Reasoning",
    description: "Hard science homework step-by-step",
    model: "deepseek-r1:8b",
    hint: "ollama run deepseek-r1:8b",
  },
  {
    id: "powerful",
    label: "Study Workstation",
    description: "Powerful study machines",
    model: "gpt-oss:20b",
    hint: "ollama run gpt-oss:20b",
  },
];

export function getAiModelProfile(id?: string | null): AiModelProfile {
  const found = AI_MODEL_PROFILES.find((p) => p.id === id);
  return found ?? AI_MODEL_PROFILES[0];
}
