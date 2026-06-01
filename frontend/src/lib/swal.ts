"use client";

import Swal from "sweetalert2";
import { enqueueAlert } from "@/lib/swal-queue";

const brand = {
  primary: "#0B3D91",
  cancel: "#64748b",
};

const base = {
  confirmButtonColor: brand.primary,
  cancelButtonColor: brand.cancel,
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-xl px-4 py-2 text-sm font-semibold",
    cancelButton: "rounded-xl px-4 py-2 text-sm font-semibold",
  },
};

export const swal = Swal.mixin(base);

export function showSuccess(title: string, text?: string) {
  return enqueueAlert(() =>
    swal.fire({
      icon: "success",
      title,
      text,
      timer: text ? undefined : 2000,
      showConfirmButton: Boolean(text),
    })
  );
}

export function showError(title: string, text?: string) {
  return enqueueAlert(() =>
    swal.fire({
      icon: "error",
      title,
      text,
    })
  );
}

export function showWarning(title: string, text?: string) {
  return enqueueAlert(() =>
    swal.fire({
      icon: "warning",
      title,
      text,
    })
  );
}

export function showInternetCheck() {
  return enqueueAlert(() =>
    swal.fire({
      icon: "warning",
      title: "Check your internet and try again",
      confirmButtonText: "OK",
    })
  );
}

export function showInfo(title: string, text?: string) {
  return enqueueAlert(() =>
    swal.fire({
      icon: "info",
      title,
      text,
    })
  );
}

export async function showConfirm(title: string, text?: string) {
  const result = await enqueueAlert(() =>
    swal.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    })
  );
  return result.isConfirmed;
}

export async function showDeleteConfirm(itemName?: string) {
  return showConfirm(
    "Are you sure?",
    itemName ? `Delete ${itemName}? This cannot be undone.` : "This action cannot be undone."
  );
}

export async function showPasswordPrompt(title: string, text?: string) {
  const result = await enqueueAlert(() =>
    swal.fire({
      title,
      text,
      input: "password",
      inputLabel: "New password (minimum 6 characters)",
      inputAttributes: {
        minlength: "6",
        autocomplete: "new-password",
        autocapitalize: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Reset password",
      cancelButtonText: "Cancel",
    })
  );

  if (!result.isConfirmed || !result.value) {
    return null;
  }

  const password = String(result.value);
  if (password.length < 6) {
    await showError("Password too short", "Password must be at least 6 characters.");
    return null;
  }

  return password;
}
