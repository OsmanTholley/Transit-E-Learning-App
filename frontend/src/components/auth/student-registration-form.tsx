"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { normalizeStudentId } from "@/lib/student-id";
import { showError, showSuccess } from "@/lib/swal";

type VerifiedStudent = {
  studentId: string;
  fullName: string;
  department: string;
  program: string;
  year: string;
  semester: string;
  admissionYear: string;
};

export function StudentRegistrationForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [verified, setVerified] = useState<VerifiedStudent | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerifyId(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentIdInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Student ID could not be verified.");
      }

      setVerified(data);
      setStep(2);
    } catch (err) {
      await showError("Verification failed", err instanceof Error ? err.message : "Invalid student ID.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!verified) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: verified.studentId,
          email,
          phone,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Registration failed.");
      }

      await showSuccess("Welcome!", data.message ?? "Your account has been created.");
      window.location.href = "/student/dashboard";
    } catch (err) {
      await showError("Registration failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetVerification() {
    setStep(1);
    setVerified(null);
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFC107]">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#0B3D91]" fill="currentColor">
            <path d="M12 2 2 7l10 5 10-5-10-5zm0 8.5L4.5 7.5 12 4l7.5 3.5L12 10.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Student Registration</h1>
        <p className="mt-1 text-sm text-slate-600">
          {step === 1
            ? "Enter your official Transit student ID to verify admission."
            : "Create your login credentials to finish registration."}
        </p>
      </div>

      {step === 1 ? (
        <form className="space-y-4" onSubmit={handleVerifyId}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Student ID *</span>
            <input
              type="text"
              required
              placeholder="e.g. TCSL/001"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeStudentId(e.target.value);
                if (normalized) setStudentIdInput(normalized);
              }}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
            />
            <p className="mt-1 text-xs text-slate-500">Format: TCSL/001 (issued by Transit College)</p>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a357f] disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Student ID"}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">ID verified successfully</p>
            <p className="mt-1 text-xs text-emerald-700">
              {verified?.studentId} — {verified?.fullName}
            </p>
          </div>

          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Department</span>
              <span className="font-medium text-slate-900">{verified?.department}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Program</span>
              <span className="font-medium text-slate-900">{verified?.program}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Year / Semester</span>
              <span className="font-medium text-slate-900">
                {verified?.year} / {verified?.semester}
              </span>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+232 ..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password *</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Confirm Password *</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetVerification}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a357f] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Complete Registration"}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0B3D91] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
