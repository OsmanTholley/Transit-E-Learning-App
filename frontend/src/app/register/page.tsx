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

type Step = "verify" | "register";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("verify");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [verified, setVerified] = useState<VerifiedStudent | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
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
      setStep("register");
      await showSuccess("ID verified", "Complete your account details below.");
    } catch (err) {
      await showError(
        "Verification failed",
        err instanceof Error ? err.message : "Student ID could not be verified."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
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

      await showSuccess("Welcome!", data.message ?? "Registration successful.");
      window.location.href = "/student/dashboard";
    } catch (err) {
      await showError("Registration failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetVerification() {
    setStep("verify");
    setVerified(null);
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFC107]">
            <span className="text-sm font-bold text-[#0B3D91]">TR</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Student Registration</h1>
            <p className="text-sm text-slate-600">Transit E-Learning</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <span
            className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${
              step === "verify" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            1. Verify ID
          </span>
          <span
            className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${
              step === "register" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            2. Create Account
          </span>
        </div>

        {step === "verify" ? (
          <form className="space-y-4" onSubmit={handleVerify}>
            <p className="text-sm text-slate-600">
              Enter your official Transit student ID. The system checks the admitted students database before
              you can register.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Student ID *</span>
              <input
                type="text"
                required
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                onBlur={(e) => {
                  const normalized = normalizeStudentId(e.target.value);
                  if (normalized) setStudentIdInput(normalized);
                }}
                placeholder="e.g. TCSL/001"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
              />
              <span className="mt-1 block text-xs text-slate-500">Format: TCSL/001</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#0B3D91] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a357f] disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Student ID"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <p className="font-semibold">ID verified: {verified?.studentId}</p>
              <p className="mt-1">{verified?.fullName}</p>
              {(verified?.department || verified?.program) && (
                <p className="mt-1 text-xs text-emerald-700">
                  {[verified?.department, verified?.program].filter(Boolean).join(" • ")}
                </p>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email *</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+232 ..."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetVerification}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-[#0B3D91] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a357f] disabled:opacity-60"
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
    </main>
  );
}
