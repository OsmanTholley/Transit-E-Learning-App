"use client";

import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProgramSubnav } from "./program-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/programs/all": { title: "All Programs", subtitle: "Create and manage academic programs by department." },
  "/admin/programs/add": { title: "Add Program", subtitle: "Create a new academic program." },
  "/admin/programs/reports": { title: "Program Reports", subtitle: "Export program catalog and enrollment reports." },
};

export function ProgramManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta["/admin/programs/all"];
  return (
    <div className="space-y-6">
      <AdminPageHeader title={meta.title} subtitle={meta.subtitle} />
      <ProgramSubnav />
      {children}
    </div>
  );
}
