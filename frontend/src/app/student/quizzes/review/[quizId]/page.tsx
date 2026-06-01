import { Suspense } from "react";
import { QuizResultsPage } from "@/components/student/quizzes/quiz-results-page";

export default async function QuizReviewRoute({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading results…</p>}>
      <QuizResultsPage quizId={quizId} />
    </Suspense>
  );
}
