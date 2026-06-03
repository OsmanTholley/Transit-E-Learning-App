"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DATABASE_OFFLINE_MESSAGE } from "@/lib/db-errors";
import { beginDatabaseOfflineRecovery } from "@/lib/db-offline-client";
import { showError } from "@/lib/swal";
import { login } from "@/services/auth";
import { TransitLogo } from "@/components/brand/transit-logo";

type LoginPortal = "student" | "staff";

function portalLabel(portal: LoginPortal): string {
  return portal === "student" ? "Student" : "Staff";
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const result = isStudent
      ? await login({ role: "student", studentId, password })
      : await login({ role: "staff", email, password });

    setLoading(false);

    if (!result.ok || !result.role) {
      if (result.offline || result.message === DATABASE_OFFLINE_MESSAGE) {
        beginDatabaseOfflineRecovery(() => {
          window.location.reload();
        });
        return;
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
              : "Sign in with your institutional email and password."}
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {isStudent ? (
            <label className="block">
              <span className="text-sm text-slate-700">Student ID</span>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="TCSL/001"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-blue-700"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm text-slate-700">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm text-slate-700">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
            />
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
