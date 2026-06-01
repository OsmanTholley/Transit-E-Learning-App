export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  createdAt: string;
};

export type AiConversation = {
  id: string;
  title: string;
  subject: string;
  messages: ChatMessage[];
  updatedAt: string;
  bookmarked: boolean;
};

export type SolvedQuestion = {
  id: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  solvedAt: string;
  answerPreview: string;
  bookmarked: boolean;
};

export type StudyPlanItem = {
  id: string;
  day: string;
  course: string;
  topic: string;
  durationMinutes: number;
  completed: boolean;
};

export type AiTutorHistoryItem = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};
