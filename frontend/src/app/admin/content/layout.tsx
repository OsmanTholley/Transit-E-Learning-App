import { ReactNode } from "react";
import { ContentManagementShell } from "@/components/content-management/content-management-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <ContentManagementShell>{children}</ContentManagementShell>;
}
