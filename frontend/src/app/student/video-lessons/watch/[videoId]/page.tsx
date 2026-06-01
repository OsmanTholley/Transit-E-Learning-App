import { VideoPlayerPage } from "@/components/student/video-lessons/video-player-page";

export default async function WatchVideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  return <VideoPlayerPage videoId={videoId} />;
}

