"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TransitLogo } from "@/components/brand/transit-logo";
import { showError } from "@/lib/swal";
import { requestPasswordReset } from "@/services/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const result = await requestPasswordReset(normalizedEmail);
    setLoading(false);

    if (!result.ok) {
      await showError("Request failed", result.message ?? "Unable to send OTP code.");
      return;
    }

    setSubmittedEmail(result.email ?? normalizedEmail);
    setMessage(
      result.message ??
        "A 6-digit OTP code has been sent to your email. Check your inbox to reset your password.",
    );
    setSent(true);
  };

  const goToOtpEntry = () => {
    const targetEmail = submittedEmail || email.trim().toLowerCase();
    router.push(`/reset-password?email=${encodeURIComponent(targetEmail)}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-center">
          <TransitLogo size="md" variant="dark" subtitle="E-Learning" />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the email on your account. We will send a 6-digit OTP code to your inbox.
        </p>

        {!sent ? (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP code"}
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Check your email</p>
              <p className="mt-2">{message}</p>
              {submittedEmail ? (
                <p className="mt-2 text-emerald-700">
                  Sent to: <span className="font-medium">{submittedEmail}</span>
                </p>
              ) : null}
              <p className="mt-2 text-emerald-700">
                The OTP expires in 15 minutes. Check your spam folder if you do not see it in inbox.
              </p>
            </div>

            <button
              type="button"
              onClick={goToOtpEntry}
              className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Enter OTP code
            </button>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setMessage("");
              }}
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Send another code
            </button>
          </div>
        )}

        <Link href="/" className="mt-4 inline-block text-sm text-blue-800 hover:underline">
          Back to login
        </Link>
      </div>
    </main>
  );
}
