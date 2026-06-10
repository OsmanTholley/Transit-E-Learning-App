"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DATABASE_OFFLINE_MESSAGE } from "@/lib/db-errors";
import { beginDatabaseOfflineRecovery } from "@/lib/db-offline-client";
import { showError } from "@/lib/swal";
import { login, type LoginErrorField } from "@/services/auth";
import { TransitLogo } from "@/components/brand/transit-logo";

type LoginPortal = "student" | "staff";

type FieldErrors = Partial<Record<LoginErrorField, string>>;

function portalLabel(portal: LoginPortal): string {
  return portal === "student" ? "Student" : "Staff";
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function UserIdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h4M7 14h10" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4" />
      <path d="M9.9 5.1A10.4 10.4 0 0112 5c6 0 10 7 10 7a18.6 18.6 0 01-4.2 5.1" />
      <path d="M6.1 6.1C3.7 7.8 2 12 2 12a18.6 18.6 0 004.2 5.1" />
    </svg>
  );
}

function fieldErrorClass(hasError: boolean) {
  return hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
    : "border-slate-300 focus:border-blue-700";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const portal: LoginPortal | null =
    roleParam === "student" || roleParam === "staff" ? roleParam : null;

  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!portal) {
      router.replace("/");
    }
  }, [portal, router]);

  if (!portal) {
    return null;
  }

  const isStudent = portal === "student";

  const clearFieldError = (field: LoginErrorField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setLoading(true);

    const result = isStudent
      ? await login({ role: "student", studentId, password })
      : await login({ role: "staff", email: email.trim().toLowerCase(), password });

    setLoading(false);

    if (!result.ok || !result.role) {
      if (result.offline || result.message === DATABASE_OFFLINE_MESSAGE) {
        beginDatabaseOfflineRecovery(() => {
          window.location.reload();
        });
        return;
      }

      if (result.field) {
        setFieldErrors({ [result.field]: result.message ?? "Invalid value." });
      }

      await showError("Sign in failed", result.message ?? "Invalid credentials.");
      return;
    }

    window.location.href = `/${result.role}/dashboard`;
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-center">
          <TransitLogo size="md" variant="dark" subtitle="E-Learning" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{portalLabel(portal)} sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isStudent
              ? "Sign in with your student ID and password."
              : "Sign in with your Email and Password."}
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          {isStudent ? (
            <label className="block">
              <span className="text-sm text-slate-700">Student ID</span>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIdIcon />
                </span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="TCSL/0000"
                  value={studentId}
                  onChange={(event) => {
                    setStudentId(event.target.value);
                    clearFieldError("studentId");
                  }}
                  aria-invalid={Boolean(fieldErrors.studentId)}
                  className={`w-full rounded-md border py-2 pl-10 pr-3 text-sm uppercase outline-none focus:ring-2 ${fieldErrorClass(Boolean(fieldErrors.studentId))}`}
                />
              </div>
              {fieldErrors.studentId ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.studentId}</p>
              ) : null}
            </label>
          ) : (
            <label className="block">
              <span className="text-sm text-slate-700">Email</span>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearFieldError("email");
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`w-full rounded-md border py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 ${fieldErrorClass(Boolean(fieldErrors.email))}`}
                />
              </div>
              {fieldErrors.email ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              ) : null}
            </label>
          )}

          <label className="block">
            <span className="text-sm text-slate-700">Password</span>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="•••••••23TK"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`w-full rounded-md border py-2 pl-3 pr-10 text-sm outline-none focus:ring-2 ${fieldErrorClass(Boolean(fieldErrors.password))}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-sm">
          {isStudent ? (
            <Link href="/register" className="font-semibold text-blue-800 hover:underline">
              New student? Verify your ID
            </Link>
          ) : null}
          
          <Link href="/forgot-password" className="text-blue-800 hover:underline">
            Forgot password?
          </Link>
          <Link href="/" className="text-slate-600 hover:text-blue-800 hover:underline">
            Choose a different portal
          </Link>
        </div>
      </div>
    </main>
  );
}
