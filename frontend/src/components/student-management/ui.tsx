import type { ReactNode } from "react";
import { StudentAccountStatus } from "@/types/student";

export function StatusBadge({ status }: { status: StudentAccountStatus | string }) {
  const styles: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Suspended: "bg-rose-50 text-rose-700 ring-rose-200",
    Pending: "bg-amber-50 text-amber-800 ring-amber-200",
    Verified: "bg-blue-50 text-blue-700 ring-blue-200",
    Inactive: "bg-rose-50 text-rose-700 ring-rose-200",
    Archived: "bg-slate-100 text-slate-600 ring-slate-200",
    Open: "bg-amber-50 text-amber-800 ring-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Dismissed: "bg-slate-100 text-slate-600 ring-slate-200",
    Present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Absent: "bg-rose-50 text-rose-700 ring-rose-200",
    Late: "bg-amber-50 text-amber-800 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    Sent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
    Draft: "bg-slate-100 text-slate-600 ring-slate-200",
    Registered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  const cls = styles[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>{status}</span>
  );
}

export function StatCard({
  label,
  value,
  tone = "emerald",
}: {
  label: string;
  value: string | number;
  tone?: "emerald" | "green" | "blue" | "amber" | "rose" | "slate";
}) {
  const tones = {
    emerald: "border-l-emerald-600",
    green: "border-l-emerald-600",
    blue: "border-l-blue-600",
    amber: "border-l-amber-500",
    rose: "border-l-rose-500",
    slate: "border-l-slate-500",
  };
  return (
    <article
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 ${tones[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

export function Panel({
  title,
  children,
  action,
  noPadding,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className={noPadding ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export function PrimaryButton({
  children,
  type = "button",
  disabled,
  onClick,
  form,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  form?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      form={form}
      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold text-slate-600">{children}</label>;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15";

export function TextInput({
  placeholder,
  className = "",
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  required,
}: {
  placeholder?: string;
  className?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      type={type}
      required={required}
      className={`${inputClass} ${className}`}
      placeholder={placeholder}
    />
  );
}

export function SelectInput({
  options,
  placeholder = "Select...",
  name,
  value,
  onChange,
  required,
  includeEmpty = true,
}: {
  options: string[];
  placeholder?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  includeEmpty?: boolean;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={inputClass}
    >
      {includeEmpty ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function StudentSection({ children }: { children: ReactNode }) {
  return <div className="min-w-0 w-full space-y-6">{children}</div>;
}
