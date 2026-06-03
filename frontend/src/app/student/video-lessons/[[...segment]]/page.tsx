import { videoLessonsSubmenu } from "@/components/student/video-lessons/video-lessons-nav-config";
import { VideoLessonsHub } from "@/components/student/video-lessons/video-lessons-hub";
import { StudentHubLayout } from "@/components/student/student-hub-layout";

export default async function StudentVideoLessonsPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;

  return (
    <StudentHubLayout
      items={videoLessonsSubmenu}
      ariaLabel="Video lesson views"
      basePath="/student/video-lessons"
    >
      <VideoLessonsHub segment={segment} />
    </StudentHubLayout>
  );
}
