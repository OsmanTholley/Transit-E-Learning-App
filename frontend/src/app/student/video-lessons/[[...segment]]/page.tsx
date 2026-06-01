import { VideoLessonsHub } from "@/components/student/video-lessons/video-lessons-hub";

export default async function StudentVideoLessonsPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;
  return <VideoLessonsHub segment={segment} />;
}

