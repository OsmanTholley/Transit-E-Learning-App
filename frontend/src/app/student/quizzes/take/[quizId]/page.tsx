import { Suspense } from "react";
import { QuizTakingPage } from "@/components/student/quizzes/quiz-taking-page";

export default async function TakeQuizRoute({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading quiz…</p>}>
      <QuizTakingPage quizId={quizId} />
    </Suspense>
  );
}
