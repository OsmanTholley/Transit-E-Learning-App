import { QuizDetailsPage } from "@/components/student/quizzes/quiz-details-page";

export default async function QuizDetailRoute({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  return <QuizDetailsPage quizId={quizId} />;
}
