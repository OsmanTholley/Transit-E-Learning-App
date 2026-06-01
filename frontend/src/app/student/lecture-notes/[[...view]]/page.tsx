import { NotesHub } from "@/components/student/lecture-notes/notes-hub";

export default async function LectureNotesPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const { view } = await params;
  const segment = view?.[0] ?? "";
  return <NotesHub view={segment} />;
}
