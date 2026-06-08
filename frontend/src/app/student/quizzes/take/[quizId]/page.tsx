import { LoadingState } from "@/components/ui/loading-indicator";
import { Suspense } from "react";
import { QuizTakingPage } from "@/components/student/quizzes/quiz-taking-page";

export default async function TakeQuizRoute({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return (
    <Suspense fallback={<LoadingState message="Loading quiz…" layout="inline" />}>
      <QuizTakingPage quizId={quizId} />
    </Suspense>
  );
}
