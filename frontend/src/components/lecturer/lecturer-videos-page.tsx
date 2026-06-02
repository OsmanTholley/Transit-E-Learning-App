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
import type { LecturerVideoRow } from "@/types/lecturer-content";
import { VIDEO_RETENTION_DAYS } from "@/lib/video-expiry";

const tabs = [
  { id: "upload", label: "Publish video" },
  { id: "manage", label: "Manage videos" },
];

function formatExpiry(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function LecturerVideosPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const { data: coursesData } = useLecturerCourses();
  const { data, loading, setData } = useApiLoad<{ videos: LecturerVideoRow[] }>(
    "/api/lecturer/videos",
    { errorTitle: "Could not load videos" }
  );

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [deletionNotice, setDeletionNotice] = useState("");
  const [useLink, setUseLink] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<LecturerVideoRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editCourseId, setEditCourseId] = useState("");
  const [editNotice, setEditNotice] = useState("");

  const courses = coursesData?.courses ?? [];
  const videos = data?.videos ?? [];

  async function onFileChange(file: File | null, forEdit = false) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, { kind: "video" });
      if (forEdit) setEditVideoUrl(uploaded.url);
      else {
        setVideoUrl(uploaded.url);
        setUseLink(false);
      }
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
    const result = await requestApi<{ video: LecturerVideoRow; message?: string }>(
      "/api/lecturer/videos",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          videoUrl,
          duration,
          deletionNotice: deletionNotice || undefined,
        }),
        errorTitle: "Could not publish video",
      }
    );
    if (result.ok) {
      setData({ videos: [result.data.video, ...videos] });
      setTitle("");
      setVideoUrl("");
      setDuration("");
      setDeletionNotice("");
      await lecturerSuccess(
        result.data.message ??
          `Video published. Students are notified it will be removed in ${VIDEO_RETENTION_DAYS} days.`
      );
      setActiveTab("manage");
    }
    setSaving(false);
  }

  function startEdit(v: LecturerVideoRow) {
    setEditing(v);
    setEditTitle(v.title);
    setEditDuration(v.duration ?? "");
    setEditVideoUrl(v.videoUrl);
    setEditCourseId(v.courseId);
    setEditNotice(v.deletionNotice ?? "");
    setActiveTab("manage");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const result = await requestApi<{ video: LecturerVideoRow }>(`/api/lecturer/videos/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: editCourseId,
        title: editTitle,
        videoUrl: editVideoUrl,
        duration: editDuration,
        deletionNotice: editNotice,
      }),
      errorTitle: "Could not update",
    });
    if (result.ok) {
      setData({ videos: videos.map((v) => (v.id === editing.id ? result.data.video : v)) });
      setEditing(null);
      await lecturerSuccess("Video updated.");
    }
    setSaving(false);
  }

  async function removeVideo(id: string) {
    const ok = await lecturerConfirm("Delete this video?", "It will be removed immediately for students.");
    if (!ok) return;
    const result = await requestApi(`/api/lecturer/videos/${id}`, {
      method: "DELETE",
      errorTitle: "Could not delete",
    });
    if (result.ok) {
      setData({ videos: videos.filter((v) => v.id !== id) });
      if (editing?.id === id) setEditing(null);
      await lecturerSuccess("Video deleted.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm">
        <h2 className="text-xl font-bold">Video lessons</h2>
        <p className="mt-2 text-sm text-blue-100">
          Upload up to about 30 minutes of video (max 500 MB). Each video is available for{" "}
          {VIDEO_RETENTION_DAYS}{" "}
          days; enrolled students receive a notification to download before it is removed.
        </p>
      </section>

      <LecturerSubTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "upload" ? (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="font-bold text-slate-900">Add video</h3>
          <div className="mt-4 space-y-3">
            <CourseSelect courses={courses} value={courseId} onChange={setCourseId} />
            <label className="block">
              <FieldLabel>Title</FieldLabel>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <FieldLabel>Duration (e.g. 45:00)</FieldLabel>
              <input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <FieldLabel>Student notice (optional)</FieldLabel>
              <textarea
                value={deletionNotice}
                onChange={(e) => setDeletionNotice(e.target.value)}
                rows={2}
                placeholder={`Leave blank for default ${VIDEO_RETENTION_DAYS}-day removal notice`}
                className={textareaClass}
              />
            </label>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setUseLink(true)}
                className={[
                  "rounded-lg px-3 py-1.5 font-semibold",
                  useLink ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                Video link
              </button>
              <button
                type="button"
                onClick={() => setUseLink(false)}
                className={[
                  "rounded-lg px-3 py-1.5 font-semibold",
                  !useLink ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                Upload MP4 (≤500 MB)
              </button>
            </div>
            {useLink ? (
              <label className="block">
                <FieldLabel>Video URL</FieldLabel>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="block">
                <FieldLabel>MP4 / WebM (up to ~30 min)</FieldLabel>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm"
                />
                {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
                {videoUrl ? <p className="mt-1 text-xs text-emerald-600">Ready to publish</p> : null}
              </label>
            )}
            <PrimaryButton type="submit" disabled={saving || !videoUrl}>
              {saving ? "Publishing…" : "Publish video"}
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
              <h3 className="font-bold text-slate-900">Edit video</h3>
              <div className="mt-4 space-y-3">
                <CourseSelect courses={courses} value={editCourseId} onChange={setEditCourseId} />
                <label className="block">
                  <FieldLabel>Title</FieldLabel>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <FieldLabel>Duration</FieldLabel>
                  <input
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>Student notice</FieldLabel>
                  <textarea
                    value={editNotice}
                    onChange={(e) => setEditNotice(e.target.value)}
                    rows={2}
                    className={textareaClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>Replace file (optional)</FieldLabel>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => void onFileChange(e.target.files?.[0] ?? null, true)}
                    className="mt-1 block w-full text-sm"
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

          <Panel title="Published videos">
            {loading && !data ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : videos.length === 0 ? (
              <p className="text-sm text-slate-500">No videos yet.</p>
            ) : (
              <ul className="space-y-3">
                {videos.map((v) => (
                  <li
                    key={v.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm"
                  >
                    <p className="font-semibold text-slate-900">{v.title}</p>
                    <p className="text-xs text-slate-500">{v.course}</p>
                    <p className="mt-1 text-xs text-amber-700">
                      Removes on: {formatExpiry(v.expiresAt)}
                    </p>
                    {v.deletionNotice ? (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{v.deletionNotice}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={v.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#0B3D91]"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => startEdit(v)}
                        className="text-xs font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeVideo(v.id)}
                        className="text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                    <ContentEngagementPanel targetType="video" targetId={v.id} compact />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
