"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your email and we will send reset instructions.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Send Reset Link
          </button>
        </form>

        {sent ? <p className="mt-4 text-sm text-emerald-700">Reset instructions sent to {email}.</p> : null}

        <Link href="/login" className="mt-4 inline-block text-sm text-blue-800 hover:underline">
          Back to login
        </Link>
      </div>
    </main>
  );
}
