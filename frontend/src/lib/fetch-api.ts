"use client";

import {
  DATABASE_OFFLINE_MESSAGE,
  SCHEMA_OUT_OF_DATE_CODE,
  SCHEMA_OUT_OF_DATE_MESSAGE,
} from "@/lib/db-errors";
import {
  beginDatabaseOfflineRecovery,
  isDatabaseOfflineResponse,
} from "@/lib/db-offline-client";
import { showError } from "@/lib/swal";

export type ApiErrorBody = { error?: string; code?: string; message?: string };

export type RequestApiOptions = RequestInit & {
  errorTitle?: string;
  /** Skip SweetAlert for failed responses (handle errors yourself). */
  silent?: boolean;
  onRecovered?: () => void;
};

export type RequestApiResult<T> =
  | { ok: true; data: T; offline: false }
  | { ok: false; offline: true }
  | { ok: false; offline: false; message: string };

function getErrorMessage(data: ApiErrorBody, fallback: string) {
  if (data.code === SCHEMA_OUT_OF_DATE_CODE) {
    return SCHEMA_OUT_OF_DATE_MESSAGE;
  }
  return data.error ?? data.message ?? fallback;
}

export async function requestApi<T>(
  input: RequestInfo,
  init?: RequestApiOptions
): Promise<RequestApiResult<T>> {
  const {
    errorTitle = "Something went wrong",
    silent = false,
    onRecovered,
    ...requestInit
  } = init ?? {};

  try {
    const response = await fetch(input, {
      credentials: "include",
      cache: "no-store",
      ...requestInit,
    });

    let data: T & ApiErrorBody;
    try {
      data = (await response.json()) as T & ApiErrorBody;
    } catch {
      data = {} as T & ApiErrorBody;
    }

    if (isDatabaseOfflineResponse(response, data)) {
      beginDatabaseOfflineRecovery(() => {
        onRecovered?.();
      });
      return { ok: false, offline: true };
    }

    if (!response.ok) {
      const message = getErrorMessage(data, "Please try again.");
      if (!silent) {
        await showError(errorTitle, message);
      }
      return { ok: false, offline: false, message };
    }

    return { ok: true, data, offline: false };
  } catch {
    if (!silent) {
      await showError(errorTitle, DATABASE_OFFLINE_MESSAGE);
    }
    return { ok: false, offline: false, message: DATABASE_OFFLINE_MESSAGE };
  }
}

/** @deprecated Use requestApi */
export async function fetchApi<T = unknown>(
  input: RequestInfo,
  init?: RequestApiOptions
): Promise<{ response: Response; data: T; offline: boolean }> {
  const result = await requestApi<T>(input, init);
  if (result.ok) {
    return {
      response: new Response(null, { status: 200 }),
      data: result.data,
      offline: false,
    };
  }
  if (result.offline) {
    return {
      response: new Response(null, { status: 503 }),
      data: {} as T,
      offline: true,
    };
  }
  return {
    response: new Response(null, { status: 500 }),
    data: { error: result.message } as T,
    offline: false,
  };
}
