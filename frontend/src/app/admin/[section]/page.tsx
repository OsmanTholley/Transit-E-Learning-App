import { redirect } from "next/navigation";
import { PortalPage } from "@/components/portal-page";

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === "students") {
    redirect("/admin/students/all");
  }
  if (section === "lecturers") {
    redirect("/admin/lecturers/all");
  }
  if (section === "departments") {
    redirect("/admin/departments/all");
  }
  if (section === "programs") {
    redirect("/admin/programs/all");
  }
  if (section === "courses") {
    redirect("/admin/courses/all");
  }
  if (section === "manage-content") {
    redirect("/admin/content/lecture-notes");
  }
  if (section === "dashboard") {
    redirect("/admin/dashboard");
  }
  if (section === "assignments") {
    redirect("/admin/content/assignments");
  }
  if (section === "quizzes") {
    redirect("/admin/content/quizzes");
  }
  if (section === "discussions") {
    redirect("/admin/content/discussions");
  }
  if (section === "reports") {
    redirect("/admin/dashboard#platform-engagement");
  }
  return <PortalPage role="admin" section={section} />;
}
