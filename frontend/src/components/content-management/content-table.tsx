"use client";

import { Fragment, useState } from "react";
import { ContentItem } from "@/types/academic";
import { ContentEngagementPanel } from "@/components/content/content-engagement-panel";
import { AdminTableShell, ViewActionLink } from "@/components/admin/admin-table-shell";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  items: ContentItem[];
  title?: string;
  toolbar?: ReactNode;
  showApproval?: boolean;
  onItemDeleted?: () => void;
};

export function ContentTable({
  items,
  title = "Content library",
  toolbar,
  showApproval = false,
  onItemDeleted,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <AdminTableShell title={title} count={items.length} countLabel="items" toolbar={toolbar}>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="hidden md:table-column" />
          <col className="w-[88px] lg:w-[100px]" />
          <col className="hidden xl:table-column w-[88px]" />
          <col className="w-[120px]" />
        </colgroup>
        <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 sm:px-4">Title</th>
            <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Details</th>
            <th className="px-3 py-2.5 sm:px-4">Status</th>
            <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Uploaded</th>
            <th className="px-3 py-2.5 text-right sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                No content items found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <Fragment key={item.id}>
                <tr className="bg-white transition-colors hover:bg-slate-50/80">
                  <td className="px-3 py-3 sm:px-4">
                    <p className="truncate font-medium text-slate-900" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.type} · {item.course}
                    </p>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell md:px-4">
                    <p className="truncate text-slate-700">{item.department}</p>
                    <p className="truncate text-xs text-slate-500">{item.lecturer}</p>
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-500 xl:table-cell xl:px-4">
                    {item.uploadedAt}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    {item.socialTarget ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                        className="text-xs font-semibold text-[#0B3D91]"
                      >
                        {expandedId === item.id ? "Hide" : "Comments"}
                      </button>
                    ) : showApproval && item.status === "Pending" ? (
                      <ViewActionLink href="/admin/content/approval" label="Review" />
                    ) : (
                      <ViewActionLink href="/admin/content/files" label="View" />
                    )}
                  </td>
                </tr>
                {item.socialTarget && expandedId === item.id ? (
                  <tr key={`${item.id}-social`}>
                    <td colSpan={5} className="bg-slate-50/50 px-4 py-3">
                      <ContentEngagementPanel
                        targetType={item.socialTarget}
                        targetId={item.id}
                        canDelete
                        onDelete={onItemDeleted}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
