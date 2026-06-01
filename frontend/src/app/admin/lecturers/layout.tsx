import { ReactNode } from "react";
import { LecturerManagementShell } from "@/components/lecturer-management/lecturer-management-shell";

export default function LecturersLayout({ children }: { children: ReactNode }) {
  return <LecturerManagementShell>{children}</LecturerManagementShell>;
}
