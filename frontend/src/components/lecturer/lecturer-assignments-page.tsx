"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { FormEvent, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { requestApi } from "@/lib/fetch-api";
import { LecturerSubTabs } from "@/components/lecturer/lecturer-sub-tabs";
import {
  CourseSelect,
  FieldLabel,
  inputClass,
  textareaClass,
  uploadFile,
  useLecturerCourses,
  lecturerConfirm,
  lecturerSuccess,
  lecturerError,
} from "@/components/lecturer/lecturer-ui";
import { Panel, PrimaryButton } from "@/components/student-management/ui";

import type { LecturerAssignmentRow, SubmissionGradeRow } from "@/types/lecturer-content";

const assignmentTabs = [
  { id: "create", label: "Create" },
  { id: "manage", label: "Manage & grade" },
];

export function LecturerAssignmentsPage() {
  const { data: coursesData } = useLecturerCourses();
  const { data, loading, setData } = useApiLoad<{ assignments: LecturerAssignmentRow[] }>(
    "/api/lecturer/assignments",
    { errorTitle: "Could not load assignments" }
  );

  const [activeTab, setActiveTab] = useState("create");
  const [editing, setEditing] = useState<LecturerAssignmentRow | null>(null);
  const [editCourseId, setEditCourseId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAttachmentUrl, setEditAttachmentUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionGradeRow[]>([]);
  const [gradingTitle, setGradingTitle] = useState("");
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { grade: string; feedback: string }>>(
    {}
  );

  const courses = coursesData?.courses ?? [];
  const assignments = data?.assignments ?? [];

  async function onFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setAttachmentUrl(uploaded.url);
    } catch (e) {
      await lecturerError("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await requestApi<{ assignment: LecturerAssignmentRow }>(
      "/api/lecturer/assignments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          instructions,
          dueDate: dueDate || null,
          attachmentUrl: attachmentUrl || null,
        }),
        errorTitle: "Could not create assignment",
      }
    );
    if (result.ok) {
      setData({ assignments: [result.data.assignment, ...assignments] });
      setTitle("");
      setInstructions("");
      setDueDate("");
      setAttachmentUrl("");
      await lecturerSuccess("Assignment published. Late submissions are blocked after the due date.");
      setActiveTab("manage");
    }
    setSaving(false);
  }

  function startEdit(a: LecturerAssignmentRow) {
    setEditing(a);
    setEditCourseId(a.courseId);
    setEditTitle(a.title);
    setEditInstructions(a.instructions ?? "");
    setEditDueDate(a.dueDate ? a.dueDate.slice(0, 16) : "");
    setEditAttachmentUrl(a.attachmentUrl ?? "");
    setActiveTab("manage");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const result = await requestApi<{ assignment: LecturerAssignmentRow }>(
      `/api/lecturer/assignments/${editing.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: editCourseId,
          title: editTitle,
          instructions: editInstructions,
          dueDate: editDueDate || null,
          attachmentUrl: editAttachmentUrl || null,
        }),
        errorTitle: "Could not update",
      }
    );
    if (result.ok) {
      setData({
        assignments: assignments.map((x) => (x.id === editing.id ? result.data.assignment : x)),
      });
      setEditing(null);
      await lecturerSuccess("Assignment updated.");
    }
    setSaving(false);
  }

  async function removeAssignment(id: string) {
    const ok = await lecturerConfirm(
      "Delete this assignment?",
      "All student submissions for it will also be removed."
    );
    if (!ok) return;
    const result = await requestApi(`/api/lecturer/assignments/${id}`, {
      method: "DELETE",
      errorTitle: "Could not delete",
    });
    if (result.ok) {
      setData({ assignments: assignments.filter((a) => a.id !== id) });
      if (editing?.id === id) setEditing(null);
      if (gradingId === id) setGradingId(null);
      await lecturerSuccess("Assignment deleted.");
    }
  }

  async function openGrading(assignmentId: string) {
    if (gradingId === assignmentId) {
      setGradingId(null);
      return;
    }
    setLoadingSubs(true);
    setGradingId(assignmentId);
    const result = await requestApi<{
      assignment: { title: string };
      submissions: SubmissionGradeRow[];
    }>(`/api/lecturer/assignments/${assignmentId}/submissions`, {
      errorTitle: "Could not load submissions",
    });
    if (result.ok) {
      setGradingTitle(result.data.assignment.title);
      setSubmissions(result.data.submissions);
      const draft: Record<string, { grade: string; feedback: string }> = {};
      for (const s of result.data.submissions) {
        draft[s.id] = { grade: s.grade ?? "", feedback: s.feedback ?? "" };
      }
      setGradeDraft(draft);
    } else {
      setGradingId(null);
    }
    setLoadingSubs(false);
  }

  async function saveGrade(submissionId: string) {
    const draft = gradeDraft[submissionId];
    if (!draft) return;
    const result = await requestApi(`/api/lecturer/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: draft.grade, feedback: draft.feedback }),
      errorTitle: "Could not save grade",
    });
    if (result.ok) {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, grade: draft.grade || null, feedback: draft.feedback || null }
            : s
        )
      );
      const refreshed = await requestApi<{ assignments: LecturerAssignmentRow[] }>(
        "/api/lecturer/assignments"
      );
      if (refreshed.ok) setData(refreshed.data);
      await lecturerSuccess("Grade saved.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Assignments & grading</h2>
          <p className="mt-2 text-sm text-blue-100">
            Set due dates (late submissions blocked), grade work, and manage assignments.
          </p>
        </div>
      </section>

      <LecturerSubTabs tabs={assignmentTabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "create" ? (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="font-bold text-slate-900">Create assignment</h3>
          <div className="mt-4 space-y-3">
            <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />
            <label className="block">
              <FieldLabel>Title</FieldLabel>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <FieldLabel>Instructions</FieldLabel>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className={textareaClass}
              />
            </label>
            <label className="block">
              <FieldLabel>Due date</FieldLabel>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>Attachment (optional)</FieldLabel>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm"
              />
              {uploading ? <p className="text-xs text-slate-500">Uploading…</p> : null}
              {attachmentUrl ? (
                <a href={attachmentUrl} className="mt-1 block text-xs text-[#0B3D91]">
                  View attachment
                </a>
              ) : null}
            </label>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Creating…" : "Publish assignment"}
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {editing ? (
            <form
              onSubmit={saveEdit}
              className="rounded-2xl border-2 border-[#0B3D91]/30 bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold text-slate-900">Edit assignment</h3>
              <div className="mt-4 space-y-3">
                <CourseSelect courses={courses} value={editCourseId} onChange={setEditCourseId} />
                <label className="block">
                  <FieldLabel>Title</FieldLabel>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>Instructions</FieldLabel>
                  <textarea
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    rows={3}
                    className={textareaClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>Due date</FieldLabel>
                  <input
                    type="datetime-local"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-2">
                  <PrimaryButton type="submit" disabled={saving}>
                    Save
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : null}

      <Panel title="Assignments">
        {loading && !data ? (
          <LoadingState message="Loading…" layout="inline" />
        ) : assignments.length === 0 ? (
          <p className="text-sm text-slate-500">No assignments yet.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-xl ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {a.course} · {a.submissions} submission(s) · {a.ungraded} ungraded
                      {a.dueDate ? ` · Due ${new Date(a.dueDate).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openGrading(a.id)}
                      className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {gradingId === a.id ? "Close" : "Grade"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeAssignment(a.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {gradingId === a.id ? (
                  <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
                    {loadingSubs ? (
                      <LoadingState message="Loading submissions…" layout="inline" />
                    ) : submissions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No submissions yet for {gradingTitle}.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {submissions.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200"
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <div>
                                <p className="font-medium">{s.studentName}</p>
                                <p className="text-xs text-slate-500">
                                  {s.studentIdCode} ·{" "}
                                  {new Date(s.submittedAt).toLocaleString()}
                                </p>
                              </div>
                              {s.fileUrl ? (
                                <a
                                  href={s.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-[#0B3D91]"
                                >
                                  Download
                                </a>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <input
                                placeholder="Grade (e.g. 85%)"
                                value={gradeDraft[s.id]?.grade ?? ""}
                                onChange={(e) =>
                                  setGradeDraft((d) => ({
                                    ...d,
                                    [s.id]: {
                                      ...d[s.id],
                                      grade: e.target.value,
                                      feedback: d[s.id]?.feedback ?? "",
                                    },
                                  }))
                                }
                                className="min-w-[120px] flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                              />
                              <input
                                placeholder="Feedback"
                                value={gradeDraft[s.id]?.feedback ?? ""}
                                onChange={(e) =>
                                  setGradeDraft((d) => ({
                                    ...d,
                                    [s.id]: {
                                      grade: d[s.id]?.grade ?? "",
                                      feedback: e.target.value,
                                    },
                                  }))
                                }
                                className="min-w-[160px] flex-[2] rounded-lg border border-slate-300 px-2 py-1 text-sm"
                              />
                              <PrimaryButton type="button" onClick={() => void saveGrade(s.id)}>
                                Save
                              </PrimaryButton>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>
        </div>
      )}
    </div>
  );
}
