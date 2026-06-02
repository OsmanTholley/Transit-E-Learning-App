"use client";

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
import { ContentEngagementPanel } from "@/components/content/content-engagement-panel";
import { Panel, PrimaryButton } from "@/components/student-management/ui";
import type { LecturerNoteRow } from "@/types/lecturer-content";

const tabs = [
  { id: "upload", label: "Upload" },
  { id: "manage", label: "Manage materials" },
];

export function LecturerMaterialsPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const { data: coursesData } = useLecturerCourses();
  const { data, loading, setData, reload } = useApiLoad<{ notes: LecturerNoteRow[] }>(
    "/api/lecturer/lecture-notes",
    { errorTitle: "Could not load lecture notes" }
  );

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<LecturerNoteRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editCourseId, setEditCourseId] = useState("");

  const courses = coursesData?.courses ?? [];
  const notes = data?.notes ?? [];

  async function onFileChange(file: File | null, forEdit = false) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      if (forEdit) setEditFileUrl(uploaded.url);
      else setFileUrl(uploaded.url);
      if (!forEdit && !title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      await lecturerError("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await requestApi<{ note: LecturerNoteRow; message?: string }>(
      "/api/lecturer/lecture-notes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title, description, fileUrl, fileType: "PDF" }),
        errorTitle: "Could not save note",
      }
    );
    if (result.ok) {
      setData({ notes: [result.data.note, ...notes] });
      setTitle("");
      setDescription("");
      setFileUrl("");
      await lecturerSuccess(result.data.message ?? "Material published with auto-generated cover.");
      setActiveTab("manage");
    }
    setSaving(false);
  }

  function startEdit(note: LecturerNoteRow) {
    setEditing(note);
    setEditTitle(note.title);
    setEditDescription(note.description ?? "");
    setEditFileUrl(note.fileUrl);
    setEditCourseId(note.courseId);
    setActiveTab("manage");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const result = await requestApi<{ note: LecturerNoteRow }>(
      `/api/lecturer/lecture-notes/${editing.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: editCourseId,
          title: editTitle,
          description: editDescription,
          fileUrl: editFileUrl,
        }),
        errorTitle: "Could not update",
      }
    );
    if (result.ok) {
      setData({ notes: notes.map((n) => (n.id === editing.id ? result.data.note : n)) });
      setEditing(null);
      await lecturerSuccess("Material updated.");
    }
    setSaving(false);
  }

  async function removeNote(id: string) {
    const ok = await lecturerConfirm("Delete this material?", "Students will no longer see it.");
    if (!ok) return;
    const result = await requestApi(`/api/lecturer/lecture-notes/${id}`, {
      method: "DELETE",
      errorTitle: "Could not delete",
    });
    if (result.ok) {
      setData({ notes: notes.filter((n) => n.id !== id) });
      if (editing?.id === id) setEditing(null);
      await lecturerSuccess("Material deleted.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm">
        <h2 className="text-xl font-bold">Lecture notes & materials</h2>
        <p className="mt-2 text-sm text-blue-100">
          Upload materials with an automatic book-style cover from the title. Manage, edit, or remove
          published items anytime.
        </p>
      </section>

      <LecturerSubTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "upload" ? (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="font-bold text-slate-900">Upload new material</h3>
          <div className="mt-4 space-y-3">
            <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />
            <label className="block">
              <FieldLabel>Title (used for cover search)</FieldLabel>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
            </label>
            <label className="block">
              <FieldLabel>Description (optional)</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={textareaClass}
              />
            </label>
            <label className="block">
              <FieldLabel>File</FieldLabel>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm"
              />
              {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
              {fileUrl ? <p className="mt-1 text-xs text-emerald-600">File ready</p> : null}
            </label>
            <PrimaryButton type="submit" disabled={saving || !fileUrl || courses.length === 0}>
              {saving ? "Publishing…" : "Publish to students"}
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
              <h3 className="font-bold text-slate-900">Edit material</h3>
              <div className="mt-4 space-y-3">
                <CourseSelect courses={courses} value={editCourseId} onChange={setEditCourseId} />
                <label className="block">
                  <FieldLabel>Title</FieldLabel>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className={textareaClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>Replace file (optional)</FieldLabel>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={(e) => void onFileChange(e.target.files?.[0] ?? null, true)}
                    className="mt-1 block w-full text-sm"
                  />
                </label>
                <div className="flex gap-2">
                  <PrimaryButton type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          <Panel
            title="Published materials"
            action={
              <button
                type="button"
                onClick={() => void reload()}
                className="text-xs font-semibold text-[#0B3D91]"
              >
                Refresh
              </button>
            }
          >
            {loading && !data ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-slate-500">No materials yet. Use Upload to add one.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {notes.map((n) => (
                  <article
                    key={n.id}
                    className="overflow-hidden rounded-xl ring-1 ring-slate-200 bg-white"
                  >
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-200 to-slate-300">
                      {n.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center p-4 text-center text-sm font-semibold text-slate-600">
                          {n.title}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-slate-900 line-clamp-2">{n.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{n.course}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={n.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#0B3D91]"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => startEdit(n)}
                          className="text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeNote(n.id)}
                          className="text-xs font-semibold text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                      <ContentEngagementPanel
                        targetType="lecture-note"
                        targetId={n.id}
                        compact
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
