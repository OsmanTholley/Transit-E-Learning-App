import { ReactNode } from "react";
import { StudentManagementShell } from "@/components/student-management/student-management-shell";

export default function StudentsLayout({ children }: { children: ReactNode }) {
  return <StudentManagementShell>{children}</StudentManagementShell>;
}
