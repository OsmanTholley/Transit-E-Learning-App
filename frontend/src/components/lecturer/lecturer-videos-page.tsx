"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { FormEvent, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { requestApi } from "@/lib/fetch-api";
import { publishLecturerVideo } from "@/lib/lecturer-ui-mutation";
import { LecturerSubTabs } from "@/components/lecturer/lecturer-sub-tabs";
import { LecturerVideoAnalyticsPanel } from "@/components/lecturer/lecturer-video-analytics-panel";
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
import { YoutubeStyleVideoPlayer } from "@/components/video/youtube-style-video-player";
import type { VideoPlayState } from "@/components/video/youtube-style-video-player";
import { YoutubeVideoCard } from "@/components/video/youtube-video-card";
import { Panel, PrimaryButton } from "@/components/student-management/ui";
import type { LecturerVideoRow } from "@/types/lecturer-content";

const tabs = [
  { id: "upload", label: "Publish video" },
  { id: "library", label: "Video library" },
  { id: "manage", label: "Manage & analytics" },
];

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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<LecturerVideoRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editCourseId, setEditCourseId] = useState("");
  const [editNotice, setEditNotice] = useState("");
  const [libraryVideo, setLibraryVideo] = useState<LecturerVideoRow | null>(null);
  const [manageVideo, setManageVideo] = useState<LecturerVideoRow | null>(null);
  const [playState, setPlayState] = useState<VideoPlayState>("paused");

  const courses = coursesData?.courses ?? [];
  const videos = data?.videos ?? [];
  const libraryPlaying = playState === "playing";

  async function onFileChange(file: File | null, forEdit = false) {
    if (!file) return;
    if (!forEdit) setPendingFile(file);
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, { kind: "video" });
      if (forEdit) setEditVideoUrl(uploaded.url);
      else {
        setVideoUrl(uploaded.url);
        setUseLink(false);
        setPendingFile(null);
      }
      if (!forEdit && !title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      if (!forEdit && (typeof navigator !== "undefined" && !navigator.onLine || (e instanceof Error && /fetch|network/i.test(e.message)))) {
        setVideoUrl("");
        setUseLink(false);
      } else {
        await lecturerError("Upload failed", e instanceof Error ? e.message : "Try again.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await publishLecturerVideo({
      courseId,
      title,
      videoUrl,
      duration,
      deletionNotice: deletionNotice || undefined,
      pendingFile,
      useLink,
    });
    if (result.status === "published") {
      setData({ videos: [result.data.video, ...videos] });
      setTitle("");
      setVideoUrl("");
      setDuration("");
      setDeletionNotice("");
      setPendingFile(null);
      setCourseId("");
      await lecturerSuccess(result.data.message ?? "Video published. Students have been notified.");
      setActiveTab("library");
    } else if (result.status === "queued") {
      setTitle("");
      setVideoUrl("");
      setDuration("");
      setDeletionNotice("");
      setPendingFile(null);
      setCourseId("");
      setActiveTab("library");
    }
    setSaving(false);
  }

  function startEdit(v: LecturerVideoRow) {
    setEditing(v);
    setManageVideo(null);
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
      if (manageVideo?.id === id) setManageVideo(null);
      if (libraryVideo?.id === id) setLibraryVideo(null);
      await lecturerSuccess("Video deleted.");
    }
  }

  function selectLibraryVideo(v: LecturerVideoRow) {
    setLibraryVideo(v);
    setPlayState("paused");
  }

  return (
    <div className="space-y-6">
      <section className="hidden rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm sm:block">
        <h2 className="text-xl font-bold">Video lessons</h2>
        <p className="mt-2 text-sm text-blue-100">
          Upload up to about 30 minutes of video (max 500 MB). Videos stay available until you or an admin
          deletes them; students are notified when you publish.
        </p>
      </section>

      <section className="sm:hidden">
        <h2 className="text-lg font-bold text-slate-900">Video lessons</h2>
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
                placeholder="Optional message shown to students with this video"
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
                {pendingFile && !videoUrl ? (
                  <p className="mt-1 text-xs text-amber-700">Video selected — will upload when you publish or reconnect.</p>
                ) : null}
              </label>
            )}
            <PrimaryButton
              type="submit"
              disabled={saving || courses.length === 0 || (!useLink && !videoUrl && !pendingFile) || (useLink && !videoUrl)}
            >
              {saving ? "Publishing…" : "Publish video"}
            </PrimaryButton>
          </div>
        </form>
      ) : activeTab === "library" ? (
        <div className="space-y-4 sm:space-y-6">
          {libraryVideo ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">{libraryVideo.title}</h3>
                  <p className="text-sm text-slate-500">{libraryVideo.course}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLibraryVideo(null);
                    setPlayState("paused");
                  }}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
              <YoutubeStyleVideoPlayer
                key={libraryVideo.id}
                src={libraryVideo.videoUrl}
                title={libraryVideo.title}
                onPlayStateChange={setPlayState}
                className="w-full"
              />
            </div>
          ) : null}

          {!libraryPlaying ? (
            <Panel title="Your video library">
              {loading && !data ? (
                <LoadingState message="Loading…" layout="inline" />
              ) : videos.length === 0 ? (
                <p className="text-sm text-slate-500">Publish a video to build your library.</p>
              ) : (
                <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                  {videos.map((v) => (
                    <YoutubeVideoCard
                      key={v.id}
                      title={v.title}
                      subtitle={v.course}
                      duration={v.duration}
                      active={libraryVideo?.id === v.id}
                      onClick={() => selectLibraryVideo(v)}
                    />
                  ))}
                </div>
              )}
            </Panel>
          ) : null}
        </div>
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
          ) : manageVideo ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">Manage & analytics</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(manageVideo)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeVideo(manageVideo.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageVideo(null)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Back to list
                  </button>
                </div>
              </div>
              <LecturerVideoAnalyticsPanel video={manageVideo} />
            </div>
          ) : (
            <Panel title="Published videos">
              {loading && !data ? (
                <LoadingState message="Loading…" layout="inline" />
              ) : videos.length === 0 ? (
                <p className="text-sm text-slate-500">No videos yet.</p>
              ) : (
                <ul className="space-y-3">
                  {videos.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{v.title}</p>
                        <p className="text-xs text-slate-500">{v.course}</p>
                        {v.deletionNotice ? (
                          <p className="mt-1 text-xs text-slate-600 line-clamp-2">{v.deletionNotice}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(null);
                            setManageVideo(v);
                          }}
                          className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0a3580]"
                        >
                          Manage & analytics
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(v)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeVideo(v.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
