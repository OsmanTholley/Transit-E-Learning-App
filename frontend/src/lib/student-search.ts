import { getAccessibleCoursesForStudent } from "@/lib/student-courses-data";
import { clearLegacyVideoExpiry } from "@/lib/video-expiry";

export type StudentSearchResult = {
  id: string;
  type: "course" | "note" | "video" | "quiz" | "assignment";
  title: string;
  subtitle: string;
  href: string;
};

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

export async function searchStudentContent(
  student: NonNullable<Awaited<ReturnType<typeof import("@/lib/student-auth").requireStudent>>>,
  rawQuery: string
): Promise<StudentSearchResult[]> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  await clearLegacyVideoExpiry();
  const courses = await getAccessibleCoursesForStudent(student.id, student);

  const results: StudentSearchResult[] = [];

  for (const course of courses) {
    const courseLabel = `${course.courseCode} · ${course.courseTitle}`;
    if (
      matchesQuery(course.courseTitle, query) ||
      matchesQuery(course.courseCode, query) ||
      matchesQuery(course.lecturer?.user.fullName ?? "", query)
    ) {
      results.push({
        id: course.id,
        type: "course",
        title: course.courseTitle,
        subtitle: course.courseCode,
        href: `/student/courses/${course.id}`,
      });
    }

    for (const note of course.lectureNotes) {
      if (
        matchesQuery(note.title, query) ||
        matchesQuery(courseLabel, query) ||
        matchesQuery(note.description ?? "", query)
      ) {
        results.push({
          id: note.id,
          type: "note",
          title: note.title,
          subtitle: courseLabel,
          href: `/student/lecture-notes/view/${note.id}`,
        });
      }
    }

    for (const video of course.videos) {
      const title = video.title ?? "Video lesson";
      if (matchesQuery(title, query) || matchesQuery(courseLabel, query)) {
        results.push({
          id: video.id,
          type: "video",
          title,
          subtitle: courseLabel,
          href: `/student/video-lessons/watch/${video.id}`,
        });
      }
    }

    for (const quiz of course.quizzes) {
      const title = quiz.title ?? "Quiz";
      if (matchesQuery(title, query) || matchesQuery(courseLabel, query)) {
        results.push({
          id: quiz.id,
          type: "quiz",
          title,
          subtitle: courseLabel,
          href: `/student/quizzes/quiz/${quiz.id}`,
        });
      }
    }

    for (const assignment of course.assignments) {
      const title = assignment.title ?? "Assignment";
      if (matchesQuery(title, query) || matchesQuery(courseLabel, query)) {
        results.push({
          id: assignment.id,
          type: "assignment",
          title,
          subtitle: courseLabel,
          href: "/student/assignments",
        });
      }
    }
  }

  return results.slice(0, 12);
}
