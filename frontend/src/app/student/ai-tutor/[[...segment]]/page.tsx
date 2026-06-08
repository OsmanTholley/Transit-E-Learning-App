import { LoadingState } from "@/components/ui/loading-indicator";
import { Suspense } from "react";
import { aiTutorSubmenu } from "@/components/student/ai-tutor/ai-tutor-nav-config";
import { AiTutorHub } from "@/components/student/ai-tutor/ai-tutor-hub";
import { StudentHubLayout } from "@/components/student/student-hub-layout";

export default async function StudentAiTutorPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;

  return (
    <Suspense fallback={<LoadingState message="Loading AI Tutor…" layout="inline" />}>
      <StudentHubLayout items={aiTutorSubmenu} ariaLabel="AI tutor views" basePath="/student/ai-tutor">
        <AiTutorHub segment={segment} />
      </StudentHubLayout>
    </Suspense>
  );
}
