"use client";

import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentSubnav } from "./content-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/content/lecture-notes": { title: "Lecture Notes", subtitle: "View, approve, and organize uploaded lecture notes." },
  "/admin/content/videos": { title: "Videos", subtitle: "Monitor and approve video content." },
  "/admin/content/assignments": { title: "Assignments", subtitle: "Monitor assignments, deadlines, and submissions." },
  "/admin/content/quizzes": { title: "Quizzes", subtitle: "Review quizzes and track performance." },
  "/admin/content/discussions": { title: "Discussions", subtitle: "Moderate discussions and remove spam." },
  "/admin/content/ai-tutor": { title: "AI Tutor Content", subtitle: "Manage AI tutor resources and usage." },
  "/admin/content/files": { title: "Uploaded Files", subtitle: "All uploaded files across the platform." },
  "/admin/content/approval": { title: "Content Approval", subtitle: "Approve or reject content before publishing." },
  "/admin/content/reported": { title: "Reported Content", subtitle: "Review reports from students and lecturers." },
  "/admin/content/analytics": { title: "Content Analytics", subtitle: "Upload stats and most active content." },
};

export function ContentManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta["/admin/content/lecture-notes"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={meta.title} subtitle={meta.subtitle} />
      <ContentSubnav />
      {children}
    </div>
  );
}
