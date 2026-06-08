"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { departmentSubmenu } from "@/services/department-management-data";

export function DepartmentSubnav() {
  return (
    <AdminSectionTabs
      items={departmentSubmenu}
      ariaLabel="Department management sections"
    />
  );
}
