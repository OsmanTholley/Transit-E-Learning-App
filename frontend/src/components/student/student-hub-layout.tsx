"use client";

import type { ReactNode } from "react";
import { HubSubNav, type HubNavItem } from "@/components/student/hub-sub-nav";

export function StudentHubLayout({
  items,
  ariaLabel,
  basePath,
  activeFilter = null,
  children,
}: {
  items: readonly HubNavItem[];
  ariaLabel: string;
  basePath: string;
  activeFilter?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <HubSubNav
        items={items}
        ariaLabel={ariaLabel}
        basePath={basePath}
        activeFilter={activeFilter}
      />
      {children}
    </div>
  );
}
