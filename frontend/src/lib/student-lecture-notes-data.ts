import { prisma } from "@/lib/prisma";
import { courseMatchesStudentProfile, formatDisplayDate } from "@/lib/student-courses-service";
import { getEnrolledCoursesForStudent } from "@/lib/student-courses-data";
import type { LectureNoteRecord, LectureNotesListResponse } from "@/types/student-lecture-notes";

function estimateFileSize(fileType: string | null) {
  const t = (fileType ?? "PDF").toUpperCase();
  if (t.includes("PPT")) return "~4.2 MB";
  if (t.includes("DOC")) return "~1.8 MB";
  return "~2.4 MB";
}

function normalizeFileType(fileType: string | null) {
  const t = (fileType ?? "PDF").toUpperCase();
  if (t.includes("DOC")) return "DOCX";
  if (t.includes("PPT")) return "PPT";
  if (t.includes("PDF")) return "PDF";
  return t;
}

export async function getLectureNotesForStudent(
  student: NonNullable<Awaited<ReturnType<typeof import("@/lib/student-auth").requireStudent>>>
): Promise<LectureNotesListResponse> {
  const courses = (await getEnrolledCoursesForStudent(student.id)).filter((c) =>
    courseMatchesStudentProfile(c, student)
  );

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const notes: LectureNoteRecord[] = courses.flatMap((course) =>
    course.lectureNotes.map((n) => {
      const description = n.description ?? "";
      const isShared =
        description.toLowerCase().includes("shared") ||
        description.toLowerCase().includes("supplementary") ||
        description.toLowerCase().includes("recommended");

      return {
        id: n.id,
        title: n.title,
        topic: description.trim() || n.title,
        courseId: course.id,
        courseTitle: course.courseTitle,
        courseCode: course.courseCode,
        semester: course.semester,
        level: course.level,
        department: course.department?.departmentName ?? "—",
        lecturerName: n.lecturer?.user.fullName ?? "Lecturer",
        fileType: normalizeFileType(n.fileType),
        fileUrl: n.fileUrl,
        description: n.description,
        uploadedAt: formatDisplayDate(n.createdAt),
        uploadedAtIso: n.createdAt.toISOString(),
        fileSizeLabel: estimateFileSize(n.fileType),
        isShared,
        isNew: n.createdAt >= weekAgo,
      };
    })
  );

  notes.sort((a, b) => new Date(b.uploadedAtIso).getTime() - new Date(a.uploadedAtIso).getTime());

  const courseMap = new Map<string, { id: string; code: string; title: string; noteCount: number }>();
  for (const note of notes) {
    const existing = courseMap.get(note.courseId);
    if (existing) {
      existing.noteCount += 1;
    } else {
      courseMap.set(note.courseId, {
        id: note.courseId,
        code: note.courseCode,
        title: note.courseTitle,
        noteCount: 1,
      });
    }
  }

  const semesters = [...new Set(notes.map((n) => n.semester).filter(Boolean))] as string[];

  return {
    notes,
    stats: {
      totalNotes: notes.length,
      downloadedNotes: 0,
      bookmarkedNotes: 0,
      recentlyAdded: notes.filter((n) => n.isNew).length,
      readCount: 0,
      averageReadingProgress: 0,
    },
    courses: [...courseMap.values()],
    semesters,
  };
}

export async function getLectureNoteById(
  student: NonNullable<Awaited<ReturnType<typeof import("@/lib/student-auth").requireStudent>>>,
  noteId: string
) {
  const { notes } = await getLectureNotesForStudent(student);
  return notes.find((n) => n.id === noteId) ?? null;
}

export async function getNoteNotifications(studentUserId: string) {
  const count = await prisma.notification.count({
    where: { userId: studentUserId, isRead: false },
  });
  return count;
}
