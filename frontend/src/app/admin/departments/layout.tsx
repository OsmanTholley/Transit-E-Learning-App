import { ReactNode } from "react";
import { DepartmentManagementShell } from "@/components/department-management/department-management-shell";

export default function DepartmentsLayout({ children }: { children: ReactNode }) {
  return <DepartmentManagementShell>{children}</DepartmentManagementShell>;
}
