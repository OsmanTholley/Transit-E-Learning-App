"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { studentSubmenu } from "@/services/student-management-data";

export function StudentSubnav() {
  return (
    <AdminSectionTabs
      items={studentSubmenu}
      ariaLabel="Student management sections"
    />
  );
}
