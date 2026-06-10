import { LiveClassroomRoomEntry } from "@/components/live-classroom/live-classroom-room-entry";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string }>;
};

export default async function AdminLiveClassRoomPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { as } = await searchParams;
  const sessionAs = as === "student" ? "student" : "lecturer";

  return <LiveClassroomRoomEntry liveClassId={id} role="admin" sessionAs={sessionAs} />;
}
