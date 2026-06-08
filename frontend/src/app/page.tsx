"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

/* ─── Nav links ─────────────────────────────────────────────── */
const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Courses", href: "#courses" },
  { label: "About", href: "#about" },
];

/* ─── Stats (shown when stats bar section is enabled) ──────── */
// const stats = [
//   { value: "2,400+", label: "Active Students" },
//   { value: "120+", label: "Courses Available" },
//   { value: "45+", label: "Expert Lecturers" },
//   { value: "98%", label: "Satisfaction Rate" },
// ];

/* ─── Features ───────────────────────────────────────────────── */
const features = [
  {
    icon: "🤖",
    title: "AI-Powered Tutor",
    desc: "Get instant answers to your questions 24/7 with our intelligent AI tutor tailored to your course content.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: "📚",
    title: "Rich Course Library",
    desc: "Access lectures, videos, PDFs, quizzes, and assignments all in one beautifully organised place.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: "🏆",
    title: "Progress Tracking",
    desc: "Real-time dashboards let you monitor your grades, attendance, and learning milestones at a glance.",
    color: "from-emerald-400 to-teal-600",
  },
  {
    icon: "💬",
    title: "Live Discussions",
    desc: "Engage with peers and lecturers in course-specific forums designed for collaborative learning.",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: "📱",
    title: "Learn Anywhere",
    desc: "Fully responsive on mobile, tablet, and desktop so you never miss a lesson wherever you are.",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: "🔐",
    title: "Secure & Verified",
    desc: "College ID-based enrolment ensures only verified Transit College students access the platform.",
    color: "from-rose-500 to-red-600",
  },
];

/* ─── Course categories ──────────────────────────────────────── */
const categories = [
  { icon: "💼", name: "Business & Management", count: 28, bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-700" },
  { icon: "💻", name: "Information Technology", count: 22, bg: "bg-indigo-50", border: "border-indigo-200", accent: "text-indigo-700" },
  { icon: "📊", name: "Accounting & Finance", count: 19, bg: "bg-amber-50", border: "border-amber-200", accent: "text-amber-700" },
  { icon: "⚙️", name: "Engineering", count: 15, bg: "bg-emerald-50", border: "border-emerald-200", accent: "text-emerald-700" },
  { icon: "🩺", name: "Health Sciences", count: 12, bg: "bg-rose-50", border: "border-rose-200", accent: "text-rose-700" },
  { icon: "📖", name: "Social Sciences", count: 24, bg: "bg-purple-50", border: "border-purple-200", accent: "text-purple-700" },
];

/* ─── Steps ──────────────────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Verify Your College ID",
    desc: "Enter your Transit College student ID to confirm your enrolment and create your account.",
  },
  {
    num: "02",
    title: "Access Your Courses",
    desc: "All your registered courses appear automatically—lectures, materials, and deadlines in one place.",
  },
  {
    num: "03",
    title: "Learn & Excel",
    desc: "Watch lectures, submit assignments, discuss with peers, and track your academic progress daily.",
  },
];

/* ─── Testimonials ───────────────────────────────────────────── */
const testimonials = [
  {
    name: "Aminata Koroma",
    role: "2nd Year – Business Administration",
    quote:
      "The AI tutor helped me understand cost accounting in ways my textbook never could. I passed my mid-terms with flying colours!",
    initials: "AK",
    color: "bg-blue-600",
  },
  {
    name: "Mohamed Bangura",
    role: "3rd Year – Information Technology",
    quote:
      "Having all my lecture slides, videos and quizzes in one dashboard saves me hours every week. This platform is a game changer.",
    initials: "MB",
    color: "bg-amber-500",
  },
  {
    name: "Isata Conteh",
    role: "1st Year – Health Sciences",
    quote:
      "As a new student, the platform made it so easy to find my classes and connect with my lecturers. I never feel lost.",
    initials: "IC",
    color: "bg-emerald-600",
  },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans antialiased" id="home">
      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md shadow-slate-200/60" : "shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[4.5rem]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-md ring-2 ring-amber-400/60 transition group-hover:ring-amber-400 lg:h-11 lg:w-11">
                <Image
                  src="/images/TCSL Logo.png"
                  alt="Transit College S/L"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain p-0.5"
                  priority
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-tight text-[#0B3D91]">
                  Transit College S/L
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
                  E-Learning Portal
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#0B3D91] xl:px-4"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login?role=student"
                id="nav-student-login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0B3D91] transition-all hover:bg-blue-50"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                id="nav-register"
                className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-400/30 transition-all hover:bg-amber-300 hover:shadow-amber-400/50 active:scale-95"
              >
                Verify
              </Link>
            </div>

            {/* Mobile / tablet burger */}
            <button
              id="mobile-menu-toggle"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 lg:hidden ${
            menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0B3D91]"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 pb-1 flex flex-col gap-2 border-t border-slate-100 mt-2">
              <Link href="/login?role=student" id="mobile-sign-in" onClick={() => setMenuOpen(false)}
                className="block text-center py-2.5 rounded-lg border border-[#0B3D91]/30 text-[#0B3D91] font-semibold text-sm">
                Sign In
              </Link>
              <Link href="/register" id="mobile-register" onClick={() => setMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-amber-400 text-slate-900 font-bold text-sm">
                Verify
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          height: "100vh",
          minHeight: "600px",
          maxHeight: "1080px",
        }}
      >
        {/* ── MOBILE / TABLET  (< lg): cinematic full-bleed photo hero ── */}
        <div className="lg:hidden relative w-full h-full flex flex-col justify-end md:justify-center">

          {/* Background photo */}
          <Image
            src="/images/students-hero.jpg"
            alt="Transit College students studying"
            fill
            className="object-cover object-top"
            priority
          />

          {/* Rich multi-stop gradient overlay — dark at bottom, semi at top */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#071e5b]/70 via-[#0B3D91]/50 to-[#071e5b]/95" />

          {/* Subtle grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mob-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mob-grid)"/>
          </svg>

          {/* Content — bottom on phone, centered on tablet */}
          <div className="relative z-10 px-5 sm:px-8 pb-14 md:pb-0 pt-24 md:pt-28 flex flex-col items-center text-center w-full max-w-2xl mx-auto">

            {/* Pill badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl md:rounded-full px-4 py-2 mb-5 max-w-full">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span className="text-white/90 text-[11px] sm:text-xs font-semibold tracking-wide sm:tracking-widest uppercase leading-snug text-center">
                Transit College Sierra Leone{" "}
                <span className="text-amber-300/90">(TCSL)</span>
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-white leading-[1.12] tracking-tight max-w-xl text-balance">
              Learn Smarter,{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10 text-amber-400">Achieve More</span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-amber-400/40 rounded-full" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base md:text-[1.05rem] text-blue-100/90 max-w-lg leading-relaxed text-pretty px-1">
              All your courses, lectures, assignments, and AI tutor in one powerful portal built
              for Transit College Sierra Leone.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full max-w-md sm:max-w-none sm:justify-center">
              <Link
                href="/login?role=student"
                id="mob-hero-student-cta"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-amber-400 text-slate-900 font-bold text-sm shadow-2xl shadow-amber-500/30 hover:bg-amber-300 transition-all active:scale-95"
              >
                Student Portal
                <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </Link>
              <Link
                href="/login?role=staff"
                id="mob-hero-staff-cta"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/20 transition-all active:scale-95"
              >
                Staff Portal
              </Link>
            </div>

            {/* Trust pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
              {[
                { icon: "✅", text: "Free for students" },
                { icon: "🔒", text: "Secure" },
                { icon: "📱", text: "Any device" },
              ].map((b) => (
                <div key={b.text} className="flex items-center justify-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5 sm:py-1">
                  <span className="text-xs shrink-0">{b.icon}</span>
                  <span className="text-white/80 text-xs font-medium whitespace-nowrap">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 50L1440 50L1440 25C1200 50 960 0 720 12C480 24 240 50 0 25L0 50Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* ── DESKTOP (lg+): two-column layout ── */}
        <div
          className="hidden lg:flex relative w-full h-full items-center"
          style={{ background: "linear-gradient(135deg, #071e5b 0%, #0B3D91 45%, #1565c0 70%, #0d47a1 100%)" }}
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-3xl" />
            <div className="absolute bottom-0 -left-24 h-[350px] w-[350px] rounded-full bg-indigo-700/20 blur-3xl" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="desk-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#desk-grid)"/>
            </svg>
          </div>

          <div className="relative w-full mx-auto max-w-7xl px-8 xl:px-12 grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">

            {/* Left – text */}
            <div className="text-left">
              <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-white/90 text-xs font-semibold tracking-wide uppercase leading-snug">
                  Transit College Sierra Leone{" "}
                  <span className="text-amber-300/90">(TCSL)</span>
                </span>
              </div>

              <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.08] tracking-tight text-balance">
                Learn Smarter,{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-amber-400">Achieve More</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-amber-400/30 rounded-full" />
                </span>
              </h1>

              <p className="mt-5 text-base text-blue-100/90 max-w-lg leading-relaxed">
                Transit E-Learning brings all your courses, lectures, assignments, and an AI tutor
                together in one powerful portal built exclusively for Transit College Sierra Leone
                students and staff.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <Link
                  href="/login?role=student"
                  id="hero-student-cta"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 text-slate-900 font-bold text-sm shadow-xl shadow-amber-400/30 hover:bg-amber-300 transition-all active:scale-95"
                >
                  Student Portal
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </Link>
                <Link
                  href="/login?role=staff"
                  id="hero-staff-cta"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/20 transition-all active:scale-95"
                >
                  Staff Portal
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                {[
                  { icon: "✅", text: "Free for enrolled students" },
                  { icon: "🔒", text: "Secure & private" },
                  { icon: "📱", text: "Any device" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5 text-blue-200 text-xs shrink-0">
                    <span>{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right – photo card */}
            <div className="flex justify-end items-center">
              <div className="relative animate-hero-slide-in" style={{ width: "420px" }}>

                <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-amber-400/20 via-blue-400/10 to-transparent blur-3xl" />
                <div className="absolute -inset-2 rounded-[2rem] bg-blue-300/10 blur-xl" />

                {/* Corner accents */}
                <div className="absolute -top-3 -right-3 h-16 w-16 rounded-2xl border-2 border-amber-400/60 z-10 pointer-events-none animate-glow-pulse" />
                <div className="absolute -bottom-3 -left-3 h-16 w-16 rounded-2xl border-2 border-white/20 z-10 pointer-events-none animate-glow-pulse" />

                {/* Photo card */}
                <div
                  className="relative rounded-[1.75rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(7,30,91,0.6)] ring-1 ring-white/25"
                  style={{ maxHeight: "calc(106vh - 160px)" }}
                >
                  <Image
                    src="/images/students-hero.jpg"
                    alt="Transit College students studying"
                    width={420}
                    height={550}
                    className="w-full object-cover object-top"
                    style={{ maxHeight: "calc(106vh - 160px)" }}
                    priority
                  />
                  <div className="absolute bottom-0 inset-x-0 h-2/5 bg-gradient-to-t from-[#071e5b]/90 via-[#0B3D91]/40 to-transparent" />

                  {/* Badge */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                        <svg className="h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-xs">Real Students. Real Results.</p>
                        <p className="text-blue-200 text-[10px] mt-0.5">Transit College S/L</p>
                      </div>
                      <div className="flex -space-x-1.5">
                        {["bg-blue-500","bg-amber-400","bg-emerald-500"].map((c,i) => (
                          <div key={i} className={`h-6 w-6 rounded-full ${c} border-2 border-white/30 flex items-center justify-center`}>
                            <span className="text-[8px] text-white font-bold">{["T","C","S",][i]}</span>
                          </div>
                        ))}
                        <div className="h-6 w-6 rounded-full bg-slate-700 border-2 border-white/30 flex items-center justify-center">
                          <span className="text-[7px] text-white font-bold">L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating pills */}
                <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-xl shadow-blue-900/20 px-3 py-2 flex items-center gap-2 z-20 animate-bob-1">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base shadow flex-shrink-0">🤖</div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">AI Tutor</p>
                    <p className="text-xs font-extrabold text-slate-800">24/7 Ready</p>
                  </div>
                </div>
                {/* <div className="absolute top-1/2 -right-5 -translate-y-1/2 bg-white rounded-xl shadow-xl shadow-blue-900/20 px-3 py-2 flex items-center gap-2 z-20 animate-bob-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-base shadow flex-shrink-0">🏆</div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Pass Rate</p>
                    <p className="text-xs font-extrabold text-slate-800">98% Success</p>
                  </div>
                </div> */}
                {/* <div className="absolute -bottom-4 right-4 bg-white rounded-xl shadow-xl shadow-blue-900/20 px-3 py-2 flex items-center gap-2 z-20 animate-bob-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-base shadow flex-shrink-0">📚</div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Courses</p>
                    <p className="text-xs font-extrabold text-slate-800">120+ Live</p>
                  </div>
                </div> */}

              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 15C480 30 240 60 0 30L0 60Z" fill="white"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      {/* <section className="relative -mt-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-4xl font-extrabold text-[#0B3D91] tracking-tight">{s.value}</span>
                <span className="mt-1 text-sm font-medium text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-[#0B3D91] text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Everything You Need to{" "}
              <span className="text-[#0B3D91]">Succeed</span>
            </h2>
            <p className="mt-4 text-base text-slate-500 leading-relaxed">
              Designed specifically for Transit College Sierra Leone Students & Lecturers, our platform delivers a world-class
              digital learning experience right at your fingertips.
            </p>
          </div>

          {/* Grid */}
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl shadow-lg mb-4`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0B3D91] transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed flex-1">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#0B3D91] opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 lg:py-28"
        style={{ background: "linear-gradient(135deg, #071e5b 0%, #0B3D91 60%, #1565c0 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-4 py-1.5 bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-widest rounded-full mb-4 border border-white/10">
              Getting Started
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Up and Running in{" "}
              <span className="text-amber-400">3 Simple Steps</span>
            </h2>
            <p className="mt-4 text-blue-200 text-base leading-relaxed">
              No complicated setup. Just verify your ID and start learning within minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+3.5rem)] right-0 h-0.5 bg-white/20" />
                )}
                {/* Number bubble */}
                <div className="h-20 w-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center mb-5 shadow-lg">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Step</span>
                  <span className="text-2xl font-extrabold text-white">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              id="how-it-works-cta"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 rounded-2xl text-slate-900 font-bold text-base shadow-xl shadow-amber-400/20 hover:bg-amber-300 transition-all active:scale-95"
            >
              Verify Now!
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── COURSES ──────────────────────────────────────────────── */}
      <section id="courses" className="bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-[#0B3D91] text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Course Catalogue
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Explore Our{" "}
              <span className="text-[#0B3D91]">Programme Areas</span>
            </h2>
            <p className="mt-4 text-slate-500 text-base leading-relaxed">
              Transit College Sierra Leone programmes are fully supported on the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className={`group flex items-center gap-4 p-5 rounded-2xl ${cat.bg} border ${cat.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
              >
                <div className="h-14 w-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-3xl flex-shrink-0">
                  {cat.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-base ${cat.accent}`}>{cat.name}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{cat.count} courses available</p>
                </div>
                <svg
                  className={`ml-auto h-5 w-5 ${cat.accent} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/login?role=student"
              id="courses-browse-cta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#0B3D91] text-[#0B3D91] font-bold text-sm hover:bg-[#0B3D91] hover:text-white transition-all"
            >
              Browse All Courses
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-[#0B3D91] text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Student Stories
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Loved by{" "}
              <span className="text-[#0B3D91]">Transit Students</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="group flex flex-col p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT BANNER ─────────────────────────────────────────── */}
      <section id="about" className="bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B3D91] to-[#1565c0] p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-10 shadow-2xl shadow-blue-900/30">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-widest rounded-full mb-5 border border-white/10">
                About Transit College
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Excellence in Education Since N/A
              </h2>
              <p className="text-blue-100 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                Transit College Sierra Leone has been shaping future leaders for over two decades.
                Our digital platform extends our commitment to quality education beyond the classroom —
                making learning accessible, flexible, and powerful for every student.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="#"
                  id="about-register-cta"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-amber-400 text-slate-900 font-bold shadow-xl shadow-amber-400/20 hover:bg-amber-300 transition-all"
                >
                  Apply Now
                </Link>
                {/* <Link
                  href="/login?role=student"
                  id="about-login-cta"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link> */}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="h-40 w-40 md:h-52 md:w-52 rounded-3xl bg-white/10 border border-white/20 shadow-xl flex items-center justify-center overflow-hidden p-4">
                <Image
                  src="/images/TCSL Logo.png"
                  alt="Transit College S/L Logo"
                  width={180}
                  height={180}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white shadow-lg ring-2 ring-amber-400/50 overflow-hidden">
                  <Image src="/images/TCSL Logo.png" alt="Transit College" width={40} height={40} className="h-full w-full object-contain p-0.5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Transit College S/L</p>
                  <p className="text-amber-400 text-[10px] font-semibold uppercase tracking-widest">E-Learning Portal</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Empowering students and staff with a modern digital learning experience.
              </p>
              <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
                <span className="text-amber-400/80">Motto</span>
                <span aria-hidden className="text-amber-400/50">·</span>
                <span className="normal-case tracking-normal text-amber-100">
                  Transformation For Excellence
                </span>
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { label: "Home", href: "#home" },
                  { label: "Features", href: "#features" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Courses", href: "#courses" },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Portals</h4>
              <ul className="space-y-2">
                {[
                  { label: "Student Portal", href: "/login?role=student" },
                  { label: "Lecturer Portal", href: "/login?role=staff" },
                  { label: "Admin Portal", href: "/login?role=staff" },
                  { label: "Apply Now", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wide">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">📍</span>
                  <span>Headquater, 1 Wonder Drive, Old Panpana, magburaka, Sierra Leone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">📧</span>
                  <span>http://transit.edu.sl/</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">📞</span>
                  <span>+232 72 197975</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>Power by Osman Tholley © {new Date().getFullYear()} Transit College S/L. All rights reserved.</p>
            {/* <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
