"use client";

import { deleteOfflineFile, getOfflineFile, saveOfflineFile } from "@/lib/offline-file-store";
import { OFFLINE_SYNC_CHANGED_EVENT } from "@/lib/offline-sync";

const UPLOAD_QUEUE_KEY = "transit.offlineUpload.queue.v1";

export type LecturerUploadKind = "material" | "video";

export type LecturerUploadJob = {
  id: string;
  kind: LecturerUploadKind;
  fileId: string | null;
  fileName: string;
  mimeType: string;
  uploadVideo: boolean;
  publishUrl: string;
  publishPayload: Record<string, unknown>;
  label: string;
  createdAt: string;
};

function readUploadQueue(): LecturerUploadJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(UPLOAD_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LecturerUploadJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUploadQueue(jobs: LecturerUploadJob[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(jobs));
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_CHANGED_EVENT));
}

export function getLecturerUploadQueueCount(): number {
  return readUploadQueue().length;
}

export async function enqueueLecturerUpload(
  input: Omit<LecturerUploadJob, "id" | "createdAt" | "fileId"> & {
    id?: string;
    file?: File | null;
  },
): Promise<string> {
  const id = input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const fileId = input.file ? id : null;

  if (input.file) {
    await saveOfflineFile(id, input.file);
  }

  const job: LecturerUploadJob = {
    id,
    kind: input.kind,
    fileId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    uploadVideo: input.uploadVideo,
    publishUrl: input.publishUrl,
    publishPayload: input.publishPayload,
    label: input.label,
    createdAt: new Date().toISOString(),
  };

  const queue = readUploadQueue();
  queue.push(job);
  writeUploadQueue(queue);
  return id;
}

async function uploadStoredFile(job: LecturerUploadJob): Promise<{ url: string; fileType: string } | null> {
  if (!job.fileId) return null;
  const file = await getOfflineFile(job.fileId);
  if (!file) return null;

  const form = new FormData();
  form.append("file", file);
  const query = job.uploadVideo ? "?kind=video" : "";
  const res = await fetch(`/api/upload${query}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = (await res.json()) as { url?: string; fileType?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "File upload failed.");
  }
  return { url: data.url, fileType: data.fileType ?? file.type };
}

async function runUploadJob(job: LecturerUploadJob): Promise<boolean> {
  const payload = { ...job.publishPayload };

  if (job.fileId) {
    const uploaded = await uploadStoredFile(job);
    if (!uploaded) {
      throw new Error("Saved file is missing. Please upload again.");
    }
    if (job.kind === "material") {
      payload.fileUrl = uploaded.url;
      payload.fileType = uploaded.fileType.split("/").pop()?.toUpperCase() ?? "PDF";
    } else {
      payload.videoUrl = uploaded.url;
    }
  }

  const res = await fetch(job.publishUrl, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    let message = "Publish failed";
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      message = data.error ?? data.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (job.fileId) {
    await deleteOfflineFile(job.fileId);
  }
  return true;
}

export async function flushLecturerUploadQueue(): Promise<{ synced: number; remaining: number; lastError: string | null }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, remaining: readUploadQueue().length, lastError: null };
  }

  const queue = readUploadQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0, lastError: null };
  }

  let synced = 0;
  let remaining = [...queue];
  let lastError: string | null = null;

  for (const job of queue) {
    if (typeof navigator !== "undefined" && !navigator.onLine) break;
    try {
      await runUploadJob(job);
      remaining = remaining.filter((item) => item.id !== job.id);
      writeUploadQueue(remaining);
      synced += 1;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Upload sync failed.";
      break;
    }
  }

  return { synced, remaining: remaining.length, lastError };
}
