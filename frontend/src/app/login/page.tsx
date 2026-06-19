"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DATABASE_OFFLINE_MESSAGE } from "@/lib/db-errors";
import { beginDatabaseOfflineRecovery } from "@/lib/db-offline-client";
import { showError } from "@/lib/swal";
import { login, type LoginErrorField } from "@/services/auth";
import { TransitLogo } from "@/components/brand/transit-logo";
import { SiteNavbar } from "@/components/site-navbar";
import "./login.css";

type LoginPortal = "student" | "staff";
type FieldErrors = Partial<Record<LoginErrorField, string>>;

function portalLabel(portal: LoginPortal): string {
  return portal === "student" ? "Student" : "Staff";
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function UserIdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h4M7 14h10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-input-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="login-eye-icon" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="login-eye-icon" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4" />
      <path d="M9.9 5.1A10.4 10.4 0 0112 5c6 0 10 7 10 7a18.6 18.6 0 01-4.2 5.1" />
      <path d="M6.1 6.1C3.7 7.8 2 12 2 12a18.6 18.6 0 004.2 5.1" />
    </svg>
  );
}

/* Animated background particles */
function Particles() {
  return (
    <div className="login-particles" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className={`login-particle login-particle-${(i % 6) + 1}`} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialPortal: LoginPortal =
    roleParam === "staff" ? "staff" : "student";

  const [activeTab, setActiveTab] = useState<LoginPortal>(initialPortal);
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const isStudent = activeTab === "student";

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
        beginDatabaseOfflineRecovery(() => { window.location.reload(); });
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
    <main className="login-root">
      {/* Animated gradient background */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>
      <Particles />

      {/* Navbar — logo + Home button only */}
      <SiteNavbar variant="light" homeOnly />

      <div className="login-container">
        {/* Left column: College value-prop (visible only in computer mood) */}
        <div className="login-info-panel">
          <div className="login-info-content">
            <h2 className="login-info-heading">Your Gateway to Transit E-Learning</h2>
            <p className="login-info-subheading">
            Online learning provides a gateway to knowledge that fits your life and pace.
            </p>
            <ul className="login-info-features">
              <li className="login-info-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="login-feature-icon">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>24/7 Access to Course Material &amp; Resources</span>
              </li>
              <li className="login-info-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="login-feature-icon">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>Real-time Student-Teacher Interaction</span>
              </li>
              <li className="login-info-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="login-feature-icon">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>Secure &amp; Fast Grade Tracking</span>
              </li>
            </ul>
            <div className="login-info-footer">
              <p>© {new Date().getFullYear()} Transit College S/L. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right column: The Card */}
        <div className="login-card-panel">
          <div className={`login-card ${mounted ? "login-card--visible" : ""}`}>
            {/* Top accent bar */}
            <div className="login-card-accent" />

            {/* Logo */}
            <div className="login-logo-row">
              <TransitLogo size="lg" variant="dark" subtitle="E-Learning" />
            </div>

            {/* Portal toggle tabs */}
            <div className="login-tabs" role="tablist" aria-label="Login portal">
              <button
                role="tab"
                aria-selected={isStudent}
                id="tab-student"
                aria-controls="panel-student"
                className={`login-tab ${isStudent ? "login-tab--active" : ""}`}
                onClick={() => { setActiveTab("student"); setFieldErrors({}); }}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="login-tab-icon">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                Student
              </button>
              <button
                role="tab"
                aria-selected={!isStudent}
                id="tab-staff"
                aria-controls="panel-staff"
                className={`login-tab ${!isStudent ? "login-tab--active" : ""}`}
                onClick={() => { setActiveTab("staff"); setFieldErrors({}); }}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="login-tab-icon">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a8.38 8.38 0 0113 0" />
                </svg>
                Staff
              </button>
            </div>

            {/* Heading */}
            <div className="login-heading-block">
              <h1 className="login-heading">{portalLabel(activeTab)} Sign In</h1>
              <p className="login-subheading">
                {isStudent
                  ? "Enter your Student ID and password to access your portal."
                  : "Enter your work email and password to access the staff portal."}
              </p>
            </div>

            {/* Form */}
            <form
              id={isStudent ? "panel-student" : "panel-staff"}
              role="tabpanel"
              aria-labelledby={isStudent ? "tab-student" : "tab-staff"}
              className="login-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* ID / Email */}
              {isStudent ? (
                <div className="login-field">
                  <label htmlFor="login-student-id" className="login-label">Student ID</label>
                  <div className="login-input-wrap">
                    <UserIdIcon />
                    <input
                      id="login-student-id"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="TCSL/0000"
                      value={studentId}
                      onChange={(e) => { setStudentId(e.target.value); clearFieldError("studentId"); }}
                      aria-invalid={Boolean(fieldErrors.studentId)}
                      className={`login-input ${fieldErrors.studentId ? "login-input--error" : ""}`}
                    />
                  </div>
                  {fieldErrors.studentId && <p className="login-field-error">{fieldErrors.studentId}</p>}
                </div>
              ) : (
                <div className="login-field">
                  <label htmlFor="login-email" className="login-label">Email Address</label>
                  <div className="login-input-wrap">
                    <MailIcon />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@transit.edu.sl"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className={`login-input ${fieldErrors.email ? "login-input--error" : ""}`}
                    />
                  </div>
                  {fieldErrors.email && <p className="login-field-error">{fieldErrors.email}</p>}
                </div>
              )}

              {/* Password */}
              <div className="login-field">
                <div className="login-label-row">
                  <label htmlFor="login-password" className="login-label">Password</label>
                  <Link href="/forgot-password" className="login-forgot-link">Forgot password?</Link>
                </div>
                <div className="login-input-wrap">
                  <LockIcon />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    className={`login-input login-input--password ${fieldErrors.password ? "login-input--error" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="login-eye-btn"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {fieldErrors.password && <p className="login-field-error">{fieldErrors.password}</p>}
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="login-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="login-submit-arrow">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer links */}
            <div className="login-footer">
              {isStudent && (
                <Link href="/register" className="login-footer-link login-footer-link--primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="login-footer-icon">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New student? Verify your ID
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
