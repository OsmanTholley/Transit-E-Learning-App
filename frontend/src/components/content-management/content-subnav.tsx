"use client";

import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { contentSubmenu } from "@/services/content-management-data";

export function ContentSubnav() {
  return (
    <AdminSectionTabs
      items={contentSubmenu}
      ariaLabel="Content management sections"
      exact
    />
  );
}
