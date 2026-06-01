"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DATABASE_OFFLINE_MESSAGE } from "@/lib/db-errors";
import { beginDatabaseOfflineRecovery } from "@/lib/db-offline-client";
import { showError } from "@/lib/swal";
import { login } from "@/services/auth";
import { AppRole } from "@/types/app";

export default function LoginPage() {
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [loading, setLoading] = useState(false);

  const isStudent = role === "student";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const result = isStudent
      ? await login({ role: "student", studentId, password })
      : await login({ role, email, password });

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
        <h1 className="text-2xl font-semibold text-slate-900">Transit E-Learning Login</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isStudent
            ? "Students sign in with their TCSL/ ID and password."
            : "Staff sign in with email and password."}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-slate-700">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
            </select>
          </label>

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
              New student? Register with your TCSL/ ID
            </Link>
          ) : null}
          <Link href="/forgot-password" className="text-blue-800 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}
