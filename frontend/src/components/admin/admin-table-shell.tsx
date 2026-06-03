import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/components/student-management/ui";

type Props = {
  title: string;
  count: number;
  countLabel?: string;
  toolbar?: ReactNode;
  variant?: "directory" | "detailed";
  children: ReactNode;
};

export function AdminTableShell({
  title,
  count,
  countLabel = "total",
  toolbar,
  variant = "directory",
  children,
}: Props) {
  return (
    <Panel
      title={title}
      noPadding
      action={
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {count} {countLabel}
        </span>
      }
    >
      {toolbar ? <div className="border-b border-slate-100 px-4 py-3 sm:px-5">{toolbar}</div> : null}
      <div className={variant === "detailed" ? "max-w-full overflow-x-auto" : "w-full min-w-0"}>{children}</div>
      <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span>
          Showing <strong className="font-semibold text-slate-700">{count}</strong> {countLabel}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <button type="button" className="rounded-lg bg-yellow-500 px-3 py-1.5 font-semibold text-white">
            1
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            disabled
          >
            Next
          </button>
        </div>
      </div>
    </Panel>
  );
}

export function ViewActionLink({ href, label = "View" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-lg bg-yellow-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-yellow-400"
    >
      {label}
    </Link>
  );
}
