import { QuizzesHub } from "@/components/student/quizzes/quizzes-hub";

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;
  return <QuizzesHub segment={segment} />;
}
