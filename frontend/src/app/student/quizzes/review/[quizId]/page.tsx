import { LoadingState } from "@/components/ui/loading-indicator";
import { Suspense } from "react";
import { QuizResultsPage } from "@/components/student/quizzes/quiz-results-page";

export default async function QuizReviewRoute({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return (
    <Suspense fallback={<LoadingState message="Loading results…" layout="inline" />}>
      <QuizResultsPage quizId={quizId} />
    </Suspense>
  );
}
