import { CoursesHub } from "@/components/student/courses/courses-hub";

export default async function StudentCoursesPage({
  params,
}: {
  params: Promise<{ segment?: string[] }>;
}) {
  const { segment } = await params;
  return <CoursesHub segment={segment} />;
}
