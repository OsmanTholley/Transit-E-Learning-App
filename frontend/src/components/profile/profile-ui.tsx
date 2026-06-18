"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useRef, useState } from "react";
import { showError } from "@/lib/swal";
import {
  FieldLabel,
  Panel,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from "@/components/student-management/ui";

export function ProfilePageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export function ProfileAvatar({
  fullName,
  profileImage,
  avatarInitials,
  editable,
  onImageChange,
}: {
  fullName: string;
  profileImage: string | null;
  avatarInitials: string;
  editable?: boolean;
  onImageChange?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!onImageChange) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      onImageChange(data.url);
    } catch (err) {
      await showError("Upload failed", err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B3D91] to-blue-700 shadow-lg ring-4 ring-white">
        {profileImage ? (
          <Image src={profileImage} alt={fullName} fill className="object-cover" sizes="96px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
            {avatarInitials}
          </span>
        )}
      </div>
      {editable ? (
        <div className="text-center sm:text-left">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0B3D91] hover:bg-slate-50 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          <p className="mt-1 text-xs text-slate-500">PNG or JPG, max 25 MB</p>
        </div>
      ) : null}
    </div>
  );
}

export function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
    />
  );
}

export function ProfileEditForm({
  children,
  onSubmit,
  onReset,
  saving,
  submitLabel = "Save profile",
}: {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
  saving: boolean;
  submitLabel?: string;
}) {
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      {children}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </PrimaryButton>
        <SecondaryButton type="button" disabled={saving} onClick={onReset}>
          Reset
        </SecondaryButton>
      </div>
    </form>
  );
}

export function CourseList({ courses }: { courses: { code: string; title: string; progress?: number }[] }) {
  if (!courses.length) {
    return <p className="text-sm text-slate-500">No courses listed yet.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {courses.map((course) => (
        <li key={`${course.code}-${course.title}`} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
          <div>
            <p className="text-sm font-semibold text-slate-900">{course.title}</p>
            <p className="text-xs text-slate-500">{course.code}</p>
          </div>
          {course.progress != null ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0B3D91]">
              {course.progress}% complete
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ActivityList({ items }: { items: { label: string; detail: string; at: string }[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No recent activity recorded.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-600">{item.detail}</p>
          </div>
          <time className="shrink-0 text-xs text-slate-500">{item.at}</time>
        </li>
      ))}
    </ul>
  );
}

export function GradesTable({
  grades,
}: {
  grades: { title: string; course: string; type: string; score: string; status: string; at: string }[];
}) {
  if (!grades.length) {
    return <p className="text-sm text-slate-500">No graded work yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4 font-semibold">Item</th>
            <th className="py-2 pr-4 font-semibold">Course</th>
            <th className="py-2 pr-4 font-semibold">Type</th>
            <th className="py-2 pr-4 font-semibold">Score</th>
            <th className="py-2 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((row) => (
            <tr key={`${row.type}-${row.title}-${row.at}`} className="border-b border-slate-100 last:border-0">
              <td className="py-2.5 pr-4 font-medium text-slate-900">{row.title}</td>
              <td className="py-2.5 pr-4 text-slate-600">{row.course}</td>
              <td className="py-2.5 pr-4 capitalize text-slate-600">{row.type}</td>
              <td className="py-2.5 pr-4 font-semibold text-[#0B3D91]">{row.score}</td>
              <td className="py-2.5 text-slate-500">{row.at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PermissionsList({ permissions }: { permissions: string[] }) {
  return (
    <ul className="space-y-2">
      {permissions.map((permission) => (
        <li key={permission} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFC107]" aria-hidden />
          {permission}
        </li>
      ))}
    </ul>
  );
}

export { Panel, FieldLabel, TextInput };
