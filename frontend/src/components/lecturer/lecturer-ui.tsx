"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import type { LecturerCourseOption } from "@/types/lecturer-content";

export function useLecturerCourses() {
  return useApiLoad<{ courses: LecturerCourseOption[] }>("/api/lecturer/courses/options", {
    errorTitle: "Could not load your courses",
  });
}

export async function uploadFile(file: File, options?: { kind?: "video" }) {
  const form = new FormData();
  form.append("file", file);
  const query = options?.kind === "video" ? "?kind=video" : "";
  const res = await fetch(`/api/upload${query}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data as { url: string; fileName: string; fileType: string };
}

export async function lecturerConfirm(title: string, text?: string) {
  const { showConfirm } = await import("@/lib/swal");
  return showConfirm(title, text);
}

export async function lecturerSuccess(message: string) {
  const { showSuccess } = await import("@/lib/swal");
  await showSuccess("Success", message);
}

export async function lecturerError(message: string, detail?: string) {
  const { showError } = await import("@/lib/swal");
  await showError(message, detail);
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{children}</span>
  );
}

export const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91]";

export const textareaClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91]";

export function CourseSelect({
  courses,
  value,
  onChange,
  required = true,
}: {
  courses: LecturerCourseOption[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>Course</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={inputClass}
      >
        <option value="">Select course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export async function showSuccess(message: string) {
  const { showSuccess: swalSuccess } = await import("@/lib/swal");
  await swalSuccess("Success", message);
}
