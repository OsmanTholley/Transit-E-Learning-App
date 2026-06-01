import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { prisma } from "@/lib/prisma";
import { mapCourseToRecord } from "@/lib/course-mapper";
import { mapProgramToRecord } from "@/lib/program-mapper";
import { isSeedDepartmentName } from "@/lib/seed-departments";

export async function buildAcademicOverview() {
  const [courseRows, programRows] = await Promise.all([
    prisma.course.findMany({
      include: {
        department: { select: { departmentName: true } },
        program: { select: { programName: true } },
        lecturer: { select: { user: { select: { fullName: true } } } },
        _count: { select: { courseStudents: true } },
      },
    }),
    prisma.program.findMany({
      include: {
        department: { select: { departmentName: true } },
        _count: { select: { students: true, courses: true } },
      },
    }),
  ]);

  const courses = courseRows.map(mapCourseToRecord);
  const programs = programRows
    .filter((p) => !p.department || !isSeedDepartmentName(p.department.departmentName))
    .map(mapProgramToRecord);

  const activeCourses = courses.filter((c) => c.status === "Active");
  const pendingCourses = courses.filter((c) => c.status === "Pending");
  const archivedCourses = courses.filter((c) => c.status === "Archived");

  const coursesByLevel = ACADEMIC_YEARS.map((level) => ({
    level,
    count: courses.filter((c) => c.level === level && c.status !== "Archived").length,
  }));

  const semesterMap = new Map<string, number>();
  for (const course of courses) {
    if (!course.semester || course.semester === "—") continue;
    semesterMap.set(course.semester, (semesterMap.get(course.semester) ?? 0) + 1);
  }

  const semesters = [...semesterMap.entries()].map(([semester, count]) => ({
    semester,
    session: new Date().getFullYear().toString(),
    courses: count,
    status: "Active" as const,
  }));

  if (semesters.length === 0) {
    semesters.push(
      { semester: "First", session: String(new Date().getFullYear()), courses: 0, status: "Active" },
      { semester: "Second", session: String(new Date().getFullYear()), courses: 0, status: "Active" }
    );
  }

  const categoryCounts = new Map<string, number>();
  for (const row of courseRows) {
    const match = row.description?.match(/Category:\s*(.+)/i);
    const cat = match?.[1]?.trim() ?? "Uncategorized";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  const categories =
    categoryCounts.size > 0
      ? [...categoryCounts.entries()].map(([name, count]) => ({ name, count }))
      : [{ name: "Uncategorized", count: courses.length }];

  const topCourses = [...activeCourses]
    .sort((a, b) => b.totalStudents - a.totalStudents)
    .slice(0, 5);

  const quizAttempts = await prisma.quizAttempt.count();
  const submissions = await prisma.submission.count();
  const graded = await prisma.submission.count({ where: { grade: { not: null } } });
  const submissionRate =
    submissions > 0 ? Math.round((graded / submissions) * 100) : 0;

  return {
    stats: {
      totalPrograms: programs.length,
      activePrograms: programs.filter((p) => p.status === "Active").length,
      totalStudents: programs.reduce((s, p) => s + p.totalStudents, 0),
      totalCourses: courses.filter((c) => c.status !== "Archived").length,
      activeCourses: activeCourses.length,
      archivedCourses: archivedCourses.length,
      pendingCourses: pendingCourses.length,
    },
    courses,
    programs,
    coursesByLevel,
    semesters,
    categories,
    topCourses,
    quizAttempts,
    submissionRate,
  };
}
