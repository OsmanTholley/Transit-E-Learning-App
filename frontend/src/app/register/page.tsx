"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { normalizeStudentId } from "@/lib/student-id";
import { showError, showSuccess } from "@/lib/swal";
import { TransitLogo } from "@/components/brand/transit-logo";
import { SiteNavbar } from "@/components/site-navbar";
import "./register.css";

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

/* ── Icons ──────────────────────────────────────────────────── */
function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="reg-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h4M7 14h10" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="reg-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="reg-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.07 2h3a2 2 0 012 1.72c.13 1 .37 1.97.72 2.9a2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006.99 7l1.18-1.18a2 2 0 012.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0122 16.92z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="reg-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="reg-eye-icon" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="reg-eye-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4" />
      <path d="M9.9 5.1A10.4 10.4 0 0112 5c6 0 10 7 10 7a18.6 18.6 0 01-4.2 5.1" />
      <path d="M6.1 6.1C3.7 7.8 2 12 2 12a18.6 18.6 0 004.2 5.1" />
    </svg>
  );
}

/* ── Animated background particles ─────────────────────────── */
function Particles() {
  return (
    <div className="reg-particles" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className={`reg-particle reg-particle-${(i % 6) + 1}`} />
      ))}
    </div>
  );
}

/* ── Step tab ────────────────────────────────────────────────── */
function StepTab({ num, label, state }: { num: number; label: string; state: "active" | "done" | "idle" }) {
  return (
    <div className={`reg-step-tab reg-step-tab--${state}`}>
      <span className="reg-step-num">
        {state === "done" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 11, height: 11 }}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : num}
      </span>
      {label}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const [step, setStep] = useState<Step>("verify");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [verified, setVerified] = useState<VerifiedStudent | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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
      if (!res.ok) throw new Error(data.error ?? "Student ID could not be verified.");
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
        body: JSON.stringify({ studentId: verified.studentId, email, phone, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed.");
      await showSuccess("Welcome!", data.message ?? "Account created successfully.");
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
    setEmail(""); setPhone(""); setPassword(""); setConfirmPassword("");
  }

  const isRegister = step === "register";

  return (
    <main className="reg-root">
      {/* Animated gradient background */}
      <div className="reg-bg" aria-hidden="true">
        <div className="reg-bg-orb reg-bg-orb-1" />
        <div className="reg-bg-orb reg-bg-orb-2" />
        <div className="reg-bg-orb reg-bg-orb-3" />
        <div className="reg-bg-grid" />
      </div>
      <Particles />

      {/* Navbar — logo + Home button only */}
      <SiteNavbar variant="light" homeOnly />

      {/* Card */}
      <div className={`reg-card ${mounted ? "reg-card--visible" : ""}`}>
        {/* Accent bar */}
        <div className="reg-card-accent" />

        {/* Logo */}
        <div className="reg-logo-row">
          <TransitLogo size="lg" variant="dark" subtitle="E-Learning" />
        </div>

        {/* Step tabs */}
        <div className="reg-steps">
          <StepTab num={1} label="Verify ID" state={isRegister ? "done" : "active"} />
          <StepTab num={2} label="Create Account" state={isRegister ? "active" : "idle"} />
        </div>

        {/* Heading */}
        <div className="reg-heading-block">
          <h1 className="reg-heading">
            {isRegister ? "Create Your Account" : "Student Verification"}
          </h1>
          <p className="reg-subheading">
            {isRegister
              ? "Fill in your details to complete registration."
              : "Enter your official Transit College student ID to get started."}
          </p>
        </div>

        {/* Verified badge (step 2 only) */}
        {isRegister && verified && (
          <div className="reg-verified-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="reg-verified-icon">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="reg-verified-text">
              <strong>ID verified: {verified.studentId}</strong>
              <span>
                {verified.fullName}
                {(verified.department || verified.program) && (
                  <> · {[verified.department, verified.program].filter(Boolean).join(" • ")}</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* ── Step 1: Verify ID ── */}
        {!isRegister ? (
          <form className="reg-form" onSubmit={handleVerify} noValidate>
            <div className="reg-field">
              <label htmlFor="reg-student-id" className="reg-label">Student ID</label>
              <div className="reg-input-wrap">
                <IdIcon />
                <input
                  id="reg-student-id"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="TCSL/0000"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  onBlur={(e) => {
                    const normalized = normalizeStudentId(e.target.value);
                    if (normalized) setStudentIdInput(normalized);
                  }}
                  className="reg-input"
                />
              </div>
              <span className="reg-input-hint">Format: TCSL/0000</span>
            </div>

            <button id="reg-verify-btn" type="submit" disabled={loading} className="reg-submit-btn">
              {loading ? (
                <>
                  <span className="reg-spinner" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                <>
                  Verify Student ID
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="reg-submit-arrow">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── Step 2: Create Account ── */
          <form className="reg-form" onSubmit={handleRegister} noValidate>
            {/* Email */}
            <div className="reg-field">
              <label htmlFor="reg-email" className="reg-label">Email Address *</label>
              <div className="reg-input-wrap">
                <MailIcon />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="reg-input"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="reg-field">
              <label htmlFor="reg-phone" className="reg-label">Phone Number</label>
              <div className="reg-input-wrap">
                <PhoneIcon />
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+232 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="reg-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="reg-field">
              <label htmlFor="reg-password" className="reg-label">Password *</label>
              <div className="reg-input-wrap">
                <LockIcon />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="reg-input reg-input--password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="reg-eye-btn"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="reg-field">
              <label htmlFor="reg-confirm-password" className="reg-label">Confirm Password *</label>
              <div className="reg-input-wrap">
                <LockIcon />
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="reg-input reg-input--password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="reg-eye-btn"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="reg-btn-row">
              <button type="button" onClick={resetVerification} className="reg-back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}>
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button id="reg-submit-btn" type="submit" disabled={loading} className="reg-submit-btn">
                {loading ? (
                  <>
                    <span className="reg-spinner" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    Complete
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="reg-submit-arrow">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="reg-footer">
          <Link href="/login?role=student" className="reg-footer-link">
            Already have an account?{" "}
            <span className="reg-footer-link--primary">Sign in</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
