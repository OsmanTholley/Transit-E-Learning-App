import { quizzesSubmenu } from "@/components/student/quizzes/quizzes-nav-config";
import { QuizzesHub } from "@/components/student/quizzes/quizzes-hub";
import { StudentHubLayout } from "@/components/student/student-hub-layout";

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;

  return (
    <StudentHubLayout items={quizzesSubmenu} ariaLabel="Quiz views" basePath="/student/quizzes">
      <QuizzesHub segment={segment} />
    </StudentHubLayout>
  );
}
