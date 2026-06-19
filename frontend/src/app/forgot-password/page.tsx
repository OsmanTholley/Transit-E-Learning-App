"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { TransitLogo } from "@/components/brand/transit-logo";
import { SiteNavbar } from "@/components/site-navbar";
import { showError } from "@/lib/swal";
import { requestPasswordReset } from "@/services/auth";
import "./forgot-password.css";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="fp-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function Particles() {
  return (
    <div className="fp-particles" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className={`fp-particle fp-particle-${(i % 6) + 1}`} />
      ))}
    </div>
  );
}

/* Step indicator */
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="fp-steps" aria-label={`Step ${step} of 2`}>
      <span className={`fp-step-dot ${step === 1 ? "fp-step-dot--active" : "fp-step-dot--done"}`} />
      <span className="fp-step-line" />
      <span className={`fp-step-dot ${step === 2 ? "fp-step-dot--active" : "fp-step-dot--idle"}`} />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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
    <main className="fp-root">
      {/* Background */}
      <div className="fp-bg" aria-hidden="true">
        <div className="fp-bg-orb fp-bg-orb-1" />
        <div className="fp-bg-orb fp-bg-orb-2" />
        <div className="fp-bg-orb fp-bg-orb-3" />
        <div className="fp-bg-grid" />
      </div>
      <Particles />

      {/* Navbar — logo + Home button only */}
      <SiteNavbar variant="light" homeOnly />

      {/* Card */}
      <div className={`fp-card ${mounted ? "fp-card--visible" : ""}`}>
        {/* Accent bar */}
        <div className="fp-card-accent" />

        {/* Logo */}
        <div className="fp-logo-row">
          <TransitLogo size="lg" variant="dark" subtitle="E-Learning" />
        </div>

        {/* Step dots */}
        <div className="fp-steps-row">
          <StepDots step={sent ? 2 : 1} />
        </div>

        {!sent ? (
          /* ── Step 1: Enter email ── */
          <div className="fp-panel fp-panel--enter">
            {/* Icon badge */}
            <div className="fp-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="fp-badge-icon">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
                <path d="M12 15v4M10 19h4" />
              </svg>
            </div>

            <div className="fp-heading-block">
              <h1 className="fp-heading">Forgot Password?</h1>
              <p className="fp-subheading">
                Enter the email linked to your account. We&apos;ll send a 6-digit OTP code to your inbox.
              </p>
            </div>

            <form className="fp-form" onSubmit={handleSubmit} noValidate>
              <div className="fp-field">
                <label htmlFor="fp-email" className="fp-label">Email Address</label>
                <div className="fp-input-wrap">
                  <MailIcon />
                  <input
                    id="fp-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@transit.edu.sl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="fp-input"
                  />
                </div>
              </div>

              <button
                id="fp-send-btn"
                type="submit"
                disabled={loading}
                className="fp-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="fp-spinner" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send OTP Code
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="fp-submit-arrow">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ── Step 2: OTP sent confirmation ── */
          <div className="fp-panel fp-panel--success">
            {/* Success badge */}
            <div className="fp-success-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="fp-success-icon">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="fp-heading-block">
              <h1 className="fp-heading">Check Your Email</h1>
              <p className="fp-subheading">{message}</p>
            </div>

            {/* Email display */}
            {submittedEmail && (
              <div className="fp-email-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fp-email-pill-icon">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <span className="fp-email-pill-text">{submittedEmail}</span>
              </div>
            )}

            {/* Expiry notice */}
            <div className="fp-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fp-notice-icon">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5l3 3" />
              </svg>
              <p className="fp-notice-text">
                OTP expires in <strong>15 minutes</strong>. Check your spam folder if you don&apos;t see it.
              </p>
            </div>

            {/* Action buttons */}
            <div className="fp-action-group">
              <button
                id="fp-enter-otp-btn"
                type="button"
                onClick={goToOtpEntry}
                className="fp-submit-btn"
              >
                Enter OTP Code
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="fp-submit-arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>

              <button
                id="fp-resend-btn"
                type="button"
                onClick={() => { setSent(false); setMessage(""); }}
                className="fp-ghost-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fp-ghost-icon">
                  <path d="M4 4v5h5M20 20v-5h-5" />
                  <path d="M4.93 14.93A10 10 0 1019.07 9.07" />
                </svg>
                Send another code
              </button>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="fp-footer">
          <Link href="/login?role=student" className="fp-back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fp-back-icon">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
