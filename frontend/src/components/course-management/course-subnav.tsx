"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { coursesSubmenu } from "@/services/academic-data";

export function CourseSubnav() {
  return (
    <AdminSectionTabs
      items={coursesSubmenu}
      ariaLabel="Course management sections"
    />
  );
}
