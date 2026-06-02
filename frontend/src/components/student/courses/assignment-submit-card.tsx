"use client";

import { useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { PrimaryButton } from "@/components/student/courses/ui/course-ui";
import type { AssignmentItem } from "@/types/student-courses";

async function uploadSubmissionFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

export function AssignmentSubmitCard({
  assignment,
  onSubmitted,
}: {
  assignment: AssignmentItem;
  onSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const isSubmitted = assignment.status === "submitted";
  const isLate = assignment.status === "late";

  async function onPickFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSubmissionFile(file);
      setFileUrl(url);
      setFileName(file.name);
    } catch (e) {
      const { showError } = await import("@/lib/swal");
      await showError("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!fileUrl) return;
    setSubmitting(true);
    const result = await requestApi(`/api/student/assignments/${assignment.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl }),
      errorTitle: "Submission failed",
    });
    if (result.ok) {
      const { showSuccess } = await import("@/lib/swal");
      await showSuccess("Submitted", "Your assignment was submitted successfully.");
      setOpen(false);
      onSubmitted();
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-4 space-y-2">
      {assignment.instructions ? (
        <p className="text-sm text-slate-600 line-clamp-3">{assignment.instructions}</p>
      ) : null}
      {isSubmitted && assignment.feedback ? (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-semibold">Feedback: </span>
          {assignment.feedback}
        </p>
      ) : null}
      {isSubmitted ? (
        <p className="text-xs text-slate-500">
          Submitted {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : ""}
        </p>
      ) : null}

      {isLate ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          The deadline has passed. You cannot submit this assignment.
        </p>
      ) : null}

      {!isLate && !open ? (
        <PrimaryButton onClick={() => setOpen(true)}>
          {isSubmitted ? "Resubmit" : "Submit assignment"}
        </PrimaryButton>
      ) : !isLate ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Upload your work (PDF, DOC, DOCX)</p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="mt-2 block w-full text-sm"
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          />
          {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
          {fileName ? (
            <p className="mt-1 text-xs text-emerald-700">Ready: {fileName}</p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <PrimaryButton disabled={!fileUrl || submitting} onClick={() => void submit()}>
              {submitting ? "Submitting…" : "Confirm submit"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
