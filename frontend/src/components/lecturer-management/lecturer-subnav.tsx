"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { lecturerSubmenu } from "@/services/lecturer-management-data";

export function LecturerSubnav() {
  return (
    <AdminSectionTabs
      items={lecturerSubmenu}
      ariaLabel="Lecturer management sections"
    />
  );
}
