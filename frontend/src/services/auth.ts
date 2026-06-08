import { DATABASE_OFFLINE_MESSAGE } from "@/lib/db-errors";
import { isDatabaseOfflineResponse } from "@/lib/db-offline-client";
import { AppRole } from "@/types/app";

type StudentLoginInput = {
  role: "student";
  studentId: string;
  password: string;
};

type StaffLoginInput = {
  role: "staff";
  email: string;
  password: string;
};

export type LoginInput = StudentLoginInput | StaffLoginInput;

export type LoginErrorField = "email" | "password" | "studentId";

type LoginResult = {
  ok: boolean;
  role?: AppRole;
  message?: string;
  field?: LoginErrorField;
  offline?: boolean;
};

export async function login(input: LoginInput): Promise<LoginResult> {
  if (!input.password) {
    return { ok: false, message: "Password is required." };
  }

  if (input.role === "student") {
    if (!input.studentId?.trim()) {
      return { ok: false, message: "Student ID is required." };
    }
  } else if (!input.email?.trim()) {
    return { ok: false, message: "Email is required." };
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = await res.json();

    if (!res.ok) {
      if (isDatabaseOfflineResponse(res, data)) {
        return { ok: false, message: DATABASE_OFFLINE_MESSAGE, offline: true };
      }
      return {
        ok: false,
        message: data.error ?? "Invalid credentials.",
        field: data.field as LoginErrorField | undefined,
      };
    }

    return { ok: true, role: data.role as AppRole };
  } catch {
    return { ok: false, message: DATABASE_OFFLINE_MESSAGE };
  }
}

export async function logout(): Promise<{ ok: boolean; message?: string; offline?: boolean }> {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (isDatabaseOfflineResponse(res, data)) {
        return { ok: false, message: DATABASE_OFFLINE_MESSAGE, offline: true };
      }
      return { ok: false, message: (data as { error?: string }).error ?? "Logout failed." };
    }

    return { ok: true };
  } catch {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { ok: false, message: DATABASE_OFFLINE_MESSAGE, offline: true };
    }
    return { ok: false, message: DATABASE_OFFLINE_MESSAGE };
  }
}
