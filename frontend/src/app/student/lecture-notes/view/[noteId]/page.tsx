import { NoteViewerPage } from "@/components/student/lecture-notes/note-viewer-page";

export default async function ViewLectureNotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  return <NoteViewerPage noteId={noteId} />;
}
