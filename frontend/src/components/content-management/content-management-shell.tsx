"use client";

import { ContentSubnav } from "./content-subnav";

export function ContentManagementShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="student-admin-layout mx-auto w-full min-w-0 max-w-[1600px]">
      <ContentSubnav />
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
