"use client";

import { requestApi } from "@/lib/fetch-api";
import { enqueueLecturerUpload } from "@/lib/lecturer-upload-sync";
import { enqueueOfflineSync, isNetworkOfflineError } from "@/lib/offline-sync";
import { showError, showSuccess, showWarning } from "@/lib/swal";
import type { LecturerNoteRow, LecturerVideoRow } from "@/types/lecturer-content";
import { uploadFile } from "@/components/lecturer/lecturer-ui";

export async function lecturerOfflineNotice(title: string, detail: string) {
  await showWarning(title, detail);
}

export async function lecturerQueuedSuccess(title: string, detail: string) {
  await showSuccess(title, detail);
}

type PublishMaterialInput = {
  courseId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  pendingFile?: File | null;
};

type PublishVideoInput = {
  courseId: string;
  title: string;
  videoUrl: string;
  duration: string;
  deletionNotice?: string;
  pendingFile?: File | null;
  useLink: boolean;
};

export type PublishResult<T> =
  | { status: "published"; data: T }
  | { status: "queued" }
  | { status: "failed" };

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

async function queueMaterialPublish(
  payload: Record<string, unknown>,
  file: File | null,
  label: string,
) {
  await enqueueLecturerUpload({
    kind: "material",
    file,
    fileName: file?.name ?? payload.title?.toString() ?? "Material",
    mimeType: file?.type ?? "application/pdf",
    uploadVideo: false,
    publishUrl: "/api/lecturer/lecture-notes",
    publishPayload: payload,
    label,
  });
  await lecturerOfflineNotice(
    "Saved offline",
    "Your material is saved on this device and will upload automatically when your internet connection returns.",
  );
}

async function queueVideoPublish(
  payload: Record<string, unknown>,
  file: File | null,
  label: string,
) {
  await enqueueLecturerUpload({
    kind: "video",
    file,
    fileName: file?.name ?? payload.title?.toString() ?? "Video",
    mimeType: file?.type ?? "video/mp4",
    uploadVideo: Boolean(file),
    publishUrl: "/api/lecturer/videos",
    publishPayload: payload,
    label,
  });
  await lecturerOfflineNotice(
    "Saved offline",
    "Your video is saved on this device and will upload automatically when your internet connection returns.",
  );
}

export async function publishLecturerMaterial(
  input: PublishMaterialInput,
): Promise<PublishResult<{ note: LecturerNoteRow; message?: string }>> {
  const label = `Material: ${input.title}`;
  let fileUrl = input.fileUrl;
  let fileType = input.fileType;

  if (isOffline()) {
    if (!input.pendingFile && !fileUrl) {
      await showError("You are offline", "Select a file before publishing.");
      return { status: "failed" };
    }
    await queueMaterialPublish(
      {
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        fileUrl: fileUrl || undefined,
        fileType,
      },
      input.pendingFile ?? null,
      label,
    );
    return { status: "queued" };
  }

  if (!fileUrl && input.pendingFile) {
    try {
      const uploaded = await uploadFile(input.pendingFile);
      fileUrl = uploaded.url;
      fileType = uploaded.fileType.split("/").pop()?.toUpperCase() ?? fileType;
    } catch (error) {
      if (isNetworkOfflineError(error)) {
        await queueMaterialPublish(
          {
            courseId: input.courseId,
            title: input.title,
            description: input.description,
            fileType,
          },
          input.pendingFile,
          label,
        );
        return { status: "queued" };
      }
      await showError("Upload failed", error instanceof Error ? error.message : "Try again.");
      return { status: "failed" };
    }
  }

  if (!fileUrl) {
    await showError("File required", "Upload a file before publishing.");
    return { status: "failed" };
  }

  const result = await requestApi<{ note: LecturerNoteRow; message?: string }>(
    "/api/lecturer/lecture-notes",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        fileUrl,
        fileType,
      }),
      silent: true,
      errorTitle: "Could not save note",
    },
  );

  if (result.offline) {
    await queueMaterialPublish(
      {
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        fileUrl,
        fileType,
      },
      null,
      label,
    );
    return { status: "queued" };
  }

  if (!result.ok) {
    await showError("Could not save note", result.message);
    return { status: "failed" };
  }

  return { status: "published", data: result.data };
}

export async function publishLecturerVideo(
  input: PublishVideoInput,
): Promise<PublishResult<{ video: LecturerVideoRow; message?: string }>> {
  const label = `Video: ${input.title || "Video lesson"}`;
  let videoUrl = input.videoUrl;

  if (isOffline()) {
    if (!input.useLink && !input.pendingFile && !videoUrl) {
      await showError("You are offline", "Select a video file or paste a link before publishing.");
      return { status: "failed" };
    }
    await queueVideoPublish(
      {
        courseId: input.courseId,
        title: input.title,
        videoUrl: videoUrl || undefined,
        duration: input.duration,
        deletionNotice: input.deletionNotice || undefined,
      },
      input.useLink ? null : input.pendingFile ?? null,
      label,
    );
    return { status: "queued" };
  }

  if (!input.useLink && !videoUrl && input.pendingFile) {
    try {
      const uploaded = await uploadFile(input.pendingFile, { kind: "video" });
      videoUrl = uploaded.url;
    } catch (error) {
      if (isNetworkOfflineError(error)) {
        await queueVideoPublish(
          {
            courseId: input.courseId,
            title: input.title,
            duration: input.duration,
            deletionNotice: input.deletionNotice || undefined,
          },
          input.pendingFile,
          label,
        );
        return { status: "queued" };
      }
      await showError("Upload failed", error instanceof Error ? error.message : "Try again.");
      return { status: "failed" };
    }
  }

  if (!videoUrl) {
    await showError("Video required", "Upload a file or provide a video link.");
    return { status: "failed" };
  }

  const result = await requestApi<{ video: LecturerVideoRow; message?: string }>("/api/lecturer/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: input.courseId,
      title: input.title,
      videoUrl,
      duration: input.duration,
      deletionNotice: input.deletionNotice || undefined,
    }),
    silent: true,
    errorTitle: "Could not publish video",
  });

  if (result.offline) {
    await queueVideoPublish(
      {
        courseId: input.courseId,
        title: input.title,
        videoUrl,
        duration: input.duration,
        deletionNotice: input.deletionNotice || undefined,
      },
      null,
      label,
    );
    return { status: "queued" };
  }

  if (!result.ok) {
    await showError("Could not publish video", result.message);
    return { status: "failed" };
  }

  return { status: "published", data: result.data };
}

/** Queue PATCH/DELETE when offline (metadata changes only). */
export async function lecturerMutation<T>(
  url: string,
  init: RequestInit & { offlineLabel: string; offlineDetail?: string; errorTitle?: string },
): Promise<{ ok: true; data: T } | { ok: false; queued?: boolean }> {
  const result = await requestApi<T>(url, {
    ...init,
    silent: true,
    errorTitle: init.errorTitle ?? "Something went wrong",
  });

  if (result.offline) {
    enqueueOfflineSync({
      url,
      method: (init.method ?? "POST").toUpperCase(),
      body: typeof init.body === "string" ? init.body : undefined,
      label: init.offlineLabel,
    });
    await lecturerOfflineNotice(
      "Saved offline",
      init.offlineDetail ??
        "Your changes are saved on this device and will sync when your internet connection returns.",
    );
    return { ok: false, queued: true };
  }

  if (!result.ok) {
    await showError(init.errorTitle ?? "Something went wrong", result.message);
    return { ok: false };
  }

  return { ok: true, data: result.data };
}
