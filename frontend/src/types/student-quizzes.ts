export type QuizStatus = "upcoming" | "active" | "in-progress" | "completed";

export type StudentQuizSummary = {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  durationMinutes: number | null;
  totalMarks: number | null;
  questionCount: number;
  instructions: string | null;
  createdAt: string;
  status: QuizStatus;
  dueDate: string | null;
  bestScore: number | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  passingScore: number;
  attemptLimit: number;
};

export type QuizQuestionView = {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank" | "image";
  options: { key: string; label: string }[];
  marks: number;
};

export type StudentQuizDetail = StudentQuizSummary & {
  questions: QuizQuestionView[];
};

export type QuizSubmitAnswer = {
  questionId: string;
  answer: string;
};

export type QuizSubmitResult = {
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeUsedSeconds: number;
  breakdown: {
    questionId: string;
    correct: boolean;
    studentAnswer: string;
    correctAnswer: string | null;
    marks: number;
    earned: number;
  }[];
};

export type LeaderboardEntry = {
  rank: number;
  studentName: string;
  courseCode: string;
  quizTitle: string;
  score: number;
  submittedAt: string;
};
