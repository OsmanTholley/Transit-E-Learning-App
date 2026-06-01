import { ReactNode } from "react";
import { CourseManagementShell } from "@/components/course-management/course-management-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <CourseManagementShell>{children}</CourseManagementShell>;
}
