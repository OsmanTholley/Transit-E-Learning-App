import { LiveClassroomRoomEntry } from "@/components/live-classroom/live-classroom-room-entry";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLiveClassRoomPage({ params }: PageProps) {
  const { id } = await params;

  return <LiveClassroomRoomEntry liveClassId={id} role="admin" />;
}
