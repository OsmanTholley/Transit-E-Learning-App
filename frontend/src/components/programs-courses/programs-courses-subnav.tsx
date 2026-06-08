"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { coursesSubmenu, programSubmenu } from "@/services/academic-data";

const programsCoursesSubmenu = [...programSubmenu, ...coursesSubmenu];

export function ProgramsCoursesSubnav() {
  return (
    <AdminSectionTabs
      items={programsCoursesSubmenu}
      ariaLabel="Programs and courses sections"
    />
  );
}
