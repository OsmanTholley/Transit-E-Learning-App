"use client";

import { requestApi, type RequestApiOptions, type RequestApiResult } from "@/lib/fetch-api";
import { enqueueOfflineSync, isNetworkOfflineError } from "@/lib/offline-sync";
import { showError, showSuccess, showWarning } from "@/lib/swal";

export type StudentMutationOptions = RequestApiOptions & {
  offlineLabel: string;
  offlineDetail?: string;
};

export async function studentError(title: string, detail?: string) {
  await showError(title, detail);
}

export async function studentSuccess(message: string) {
  await showSuccess("Success", message);
}

export async function studentWarning(title: string, detail?: string) {
  await showWarning(title, detail);
}

export function reportStudentError(title: string, error: unknown, fallback = "Please try again.") {
  if (isNetworkOfflineError(error)) {
    void studentWarning("You are offline", "Your changes are saved locally and will sync when you reconnect.");
    return;
  }

  const detail = error instanceof Error ? error.message : fallback;
  void studentError(title, detail);
}

function resolveRequestUrl(input: RequestInfo) {
  return typeof input === "string" ? input : input.url;
}

function resolveRequestHeaders(init?: RequestInit) {
  if (!init?.headers) return undefined;
  if (init.headers instanceof Headers) {
    return Object.fromEntries(init.headers.entries());
  }
  return init.headers as Record<string, string>;
}

/** POST/PUT/PATCH with SweetAlert errors and offline queue when disconnected. */
export async function studentMutation<T>(
  input: RequestInfo,
  options: StudentMutationOptions
): Promise<RequestApiResult<T>> {
  const {
    offlineLabel,
    offlineDetail,
    errorTitle = "Something went wrong",
    ...init
  } = options;

  const result = await requestApi<T>(input, {
    ...init,
    silent: true,
    errorTitle,
  });

  if (result.offline) {
    enqueueOfflineSync({
      url: resolveRequestUrl(input),
      method: (init.method ?? "POST").toUpperCase(),
      body: typeof init.body === "string" ? init.body : undefined,
      headers: resolveRequestHeaders(init),
      label: offlineLabel,
    });
    void studentWarning(
      "You are offline",
      offlineDetail ?? "Your changes are saved locally and will sync when you reconnect."
    );
    return result;
  }

  if (!result.ok) {
    void studentError(errorTitle, result.message);
  }

  return result;
}
