import { ReactNode } from "react";
import { ProgramManagementShell } from "@/components/program-management/program-management-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <ProgramManagementShell>{children}</ProgramManagementShell>;
}
