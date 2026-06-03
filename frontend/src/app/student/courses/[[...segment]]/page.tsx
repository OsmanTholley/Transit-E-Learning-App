import { redirect } from "next/navigation";
import { CoursesHub } from "@/components/student/courses/courses-hub";

export default async function StudentCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ segment?: string[] }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { segment } = await params;
  const { filter } = await searchParams;

  if (segment?.[0] === "completed") {
    redirect("/student/courses?filter=completed");
  }

  return <CoursesHub segment={segment} filter={filter ?? null} />;
}
