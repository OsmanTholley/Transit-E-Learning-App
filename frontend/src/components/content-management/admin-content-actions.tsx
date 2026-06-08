"use client";

import { FormEvent, useState } from "react";
import { AdminRowActions, confirmAndDelete } from "@/components/admin/admin-entity-crud";
import { requestApi } from "@/lib/fetch-api";
import { showSuccess } from "@/lib/swal";
import { YoutubeStyleVideoPlayer } from "@/components/video/youtube-style-video-player";
import type { ContentItem } from "@/types/academic";

type VideoDetail = {
  id: string;
  title?: string | null;
  videoUrl?: string;
  duration?: string | null;
  courseId?: string;
  lecturerId?: string | null;
  deletionNotice?: string | null;
  course?: { courseCode?: string; courseTitle?: string };
  lecturer?: { user?: { fullName?: string } };
};

type Props = {
  item: ContentItem;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export function AdminContentActions({ item, onUpdated, onDeleted }: Props) {
  const [viewing, setViewing] = useState(false);
  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [duration, setDuration] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  if (!item.contentTarget) return null;

  const apiBase = `/api/admin/content/${item.contentTarget}/${item.id}`;
  const isVideo = item.contentTarget === "video";

  async function openView() {
    const result = await requestApi<{ item: VideoDetail }>(apiBase, {
      errorTitle: "Could not load content",
    });
    if (!result.ok) return;
    setVideoDetail(result.data.item);
    setViewing(true);
  }

  async function openEdit() {
    if (isVideo) {
      const result = await requestApi<{ item: VideoDetail }>(apiBase, {
        errorTitle: "Could not load content",
      });
      if (!result.ok) return;
      const detail = result.data.item;
      setTitle(detail.title ?? item.title);
      setDuration(detail.duration ?? "");
      setVideoUrl(detail.videoUrl ?? "");
      setNotice(detail.deletionNotice ?? "");
    } else {
      setTitle(item.title);
    }
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const body = isVideo
      ? {
          title: title.trim(),
          duration: duration.trim() || null,
          videoUrl: videoUrl.trim() || undefined,
          deletionNotice: notice.trim() || null,
        }
      : { title: title.trim() };
    const result = await requestApi(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      errorTitle: "Could not update",
    });
    setSaving(false);
    if (!result.ok) return;
    await showSuccess("Updated", "Content saved.");
    setEditing(false);
    onUpdated?.();
  }

  return (
    <>
      <AdminRowActions
        onView={() => void openView()}
        onEdit={() => void openEdit()}
        onDelete={() =>
          void confirmAndDelete(apiBase, "This content will be permanently removed.", () => onDeleted?.())
        }
      />

      {viewing && videoDetail && isVideo && videoDetail.videoUrl ? (
        <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-crud-modal admin-crud-modal--wide max-w-4xl">
            <div className="admin-crud-modal-header admin-crud-modal-header--course">
              <div className="admin-crud-modal-header-top">
                <div>
                  <p className="admin-crud-modal-kicker">Video</p>
                  <h3 className="admin-crud-modal-title">{videoDetail.title ?? item.title}</h3>
                  <p className="admin-crud-modal-subtitle">
                    {item.course} · {item.lecturer}
                  </p>
                </div>
                <button type="button" onClick={() => setViewing(false)} className="admin-crud-modal-close" aria-label="Close">
                  ×
                </button>
              </div>
            </div>
            <div className="admin-crud-modal-body space-y-4">
              <YoutubeStyleVideoPlayer
                src={videoDetail.videoUrl}
                title={videoDetail.title ?? item.title}
                className="w-full"
              />
              {videoDetail.deletionNotice ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{videoDetail.deletionNotice}</p>
              ) : null}
            </div>
            <div className="admin-crud-modal-footer gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewing(false);
                  void openEdit();
                }}
                className="admin-crud-btn-primary"
              >
                Edit video
              </button>
              <button type="button" onClick={() => setViewing(false)} className="admin-crud-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : viewing ? (
        <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-crud-modal admin-crud-modal--wide">
            <div className="admin-crud-modal-header admin-crud-modal-header--course">
              <div className="admin-crud-modal-header-top">
                <div>
                  <p className="admin-crud-modal-kicker">{item.type}</p>
                  <h3 className="admin-crud-modal-title">{item.title}</h3>
                </div>
                <button type="button" onClick={() => setViewing(false)} className="admin-crud-modal-close" aria-label="Close">
                  ×
                </button>
              </div>
            </div>
            <div className="admin-crud-modal-body">
              <pre className="max-h-80 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(videoDetail, null, 2)}
              </pre>
            </div>
            <div className="admin-crud-modal-footer">
              <button type="button" onClick={() => setViewing(false)} className="admin-crud-btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-crud-modal admin-crud-modal--wide">
            <div className="admin-crud-modal-header admin-crud-modal-header--course">
              <div className="admin-crud-modal-header-top">
                <h3 className="admin-crud-modal-title">Edit {isVideo ? "video" : "content"}</h3>
                <button type="button" onClick={() => setEditing(false)} className="admin-crud-modal-close" aria-label="Close">
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-crud-modal-body space-y-4">
                <div className="admin-crud-field">
                  <label className="admin-crud-label">Title</label>
                  <input
                    className="admin-crud-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                {isVideo ? (
                  <>
                    <div className="admin-crud-field">
                      <label className="admin-crud-label">Duration</label>
                      <input
                        className="admin-crud-input"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g. 45:00"
                      />
                    </div>
                    <div className="admin-crud-field">
                      <label className="admin-crud-label">Video URL</label>
                      <input
                        className="admin-crud-input"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="admin-crud-field">
                      <label className="admin-crud-label">Student notice</label>
                      <textarea
                        className="admin-crud-input min-h-20"
                        value={notice}
                        onChange={(e) => setNotice(e.target.value)}
                      />
                    </div>
                  </>
                ) : null}
              </div>
              <div className="admin-crud-modal-footer">
                <button type="submit" disabled={saving} className="admin-crud-btn-primary">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="admin-crud-btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
