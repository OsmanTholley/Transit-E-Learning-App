import { lectureNotesSubmenu } from "@/components/student/lecture-notes/notes-nav-config";
import { NotesHub } from "@/components/student/lecture-notes/notes-hub";
import { StudentHubLayout } from "@/components/student/student-hub-layout";

export default async function LectureNotesPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const { view } = await params;
  const segment = view?.[0] ?? "";

  return (
    <StudentHubLayout
      items={lectureNotesSubmenu}
      ariaLabel="Lecture notes views"
      basePath="/student/lecture-notes"
    >
      <NotesHub view={segment} />
    </StudentHubLayout>
  );
}
