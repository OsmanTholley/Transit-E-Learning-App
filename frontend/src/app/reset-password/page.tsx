"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TransitLogo } from "@/components/brand/transit-logo";
import { showError, showSuccess } from "@/lib/swal";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      await showError("Email required", "Enter the email address you used to request the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      await showError("Invalid OTP", "Enter the 6-digit code from your email.");
      return;
    }

    if (password.length < 8) {
      await showError("Password too short", "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      await showError("Passwords do not match", "Please make sure both passwords match.");
      return;
    }

    setLoading(true);
    const result = await resetPassword({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      password,
    });
    setLoading(false);

    if (!result.ok) {
      await showError("Reset failed", result.message ?? "Unable to reset password.");
      return;
    }

    await showSuccess("Password updated", result.message);
    router.push("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-center">
          <TransitLogo size="md" variant="dark" subtitle="E-Learning" />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Enter OTP &amp; new password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Check your email for the 6-digit OTP code, then choose a new password below.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
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

          <label className="block">
            <span className="text-sm text-slate-700">OTP code</span>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-[0.3em] outline-none focus:border-blue-700"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">New password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Reset password"}
          </button>
        </form>

        <Link href="/forgot-password" className="mt-4 inline-block text-sm text-blue-800 hover:underline">
          Request a new OTP code
        </Link>

        <Link href="/" className="mt-2 block text-sm text-blue-800 hover:underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
