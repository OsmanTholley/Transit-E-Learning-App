"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { programSubmenu } from "@/services/academic-data";

export function ProgramSubnav() {
  return (
    <AdminSectionTabs
      items={programSubmenu}
      ariaLabel="Program management sections"
    />
  );
}
