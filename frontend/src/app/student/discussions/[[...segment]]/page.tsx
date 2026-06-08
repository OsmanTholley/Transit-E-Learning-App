import { LoadingState } from "@/components/ui/loading-indicator";
import { Suspense } from "react";
import { discussionsSubmenu } from "@/components/student/discussions/discussions-nav-config";
import { DiscussionsHub } from "@/components/student/discussions/discussions-hub";
import { StudentHubLayout } from "@/components/student/student-hub-layout";

export default async function StudentDiscussionsPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;

  return (
    <Suspense fallback={<LoadingState message="Loading discussions…" layout="inline" />}>
      <StudentHubLayout
        items={discussionsSubmenu}
        ariaLabel="Discussion views"
        basePath="/student/discussions"
      >
        <DiscussionsHub segment={segment} />
      </StudentHubLayout>
    </Suspense>
  );
}
