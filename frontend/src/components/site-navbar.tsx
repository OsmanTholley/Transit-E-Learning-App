"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Courses", href: "/#courses" },
  { label: "About", href: "/#about" },
];

type Props = {
  /** "light" = white background (home page)
   *  "dark"  = glass/transparent dark (login / auth pages) */
  variant?: "light" | "dark";
  /** Hide the Sign In button (e.g. when already on the login page) */
  hideSignIn?: boolean;
  /** Show ONLY the logo + Home button — no nav links, no CTAs, no hamburger */
  homeOnly?: boolean;
};

export function SiteNavbar({
  variant = "light",
  hideSignIn = false,
  homeOnly = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDark = variant === "dark";

  const headerClass = isDark
    ? [
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || menuOpen
          ? "bg-[rgba(4,13,32,0.95)] shadow-lg shadow-black/30 border-b border-[rgba(255,193,7,0.18)]"
          : "bg-[rgba(4,13,32,0.70)] border-b border-[rgba(255,193,7,0.10)]",
        "backdrop-blur-xl",
      ].join(" ")
    : [
        "fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 bg-white transition-shadow duration-300",
        scrolled ? "shadow-md shadow-slate-200/60" : "shadow-sm",
      ].join(" ");

  /* ── Shared logo JSX ─────────────────────────────────────────── */
  const Logo = (
    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 sm:gap-3">
      <div
        className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white shadow-md ring-2 transition sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${
          isDark
            ? "ring-amber-400/50 group-hover:ring-amber-400 shadow-black/40"
            : "ring-amber-400/60 group-hover:ring-amber-400"
        }`}
      >
        <Image
          src="/images/tcsl-logo.png"
          alt="Transit College S/L"
          width={48}
          height={48}
          className="h-full w-full object-contain p-0.5"
          priority
        />
      </div>
      <div className="leading-tight">
        <p
          className={`text-xs font-bold tracking-tight sm:text-sm ${
            isDark ? "text-white" : "text-[#0B3D91]"
          }`}
        >
          Transit College S/L
        </p>
        <p
          className={`text-[9px] font-semibold uppercase tracking-widest sm:text-[10px] ${
            isDark ? "text-amber-400" : "text-amber-500"
          }`}
        >
          E-Learning Portal
        </p>
      </div>
    </Link>
  );

  /* ══════════════════════════════════════════════════════════════
     HOME-ONLY MODE  (login / forgot-password / reset-password)
     Renders: Logo (left) + single "Home" button (right).
     No nav links, no CTAs, no hamburger — clean & minimal.
  ══════════════════════════════════════════════════════════════ */
  if (homeOnly) {
    const homeBtn = isDark
      ? "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-white/85 border border-white/20 backdrop-blur-sm transition-all hover:bg-amber-400/15 hover:text-amber-300 hover:border-amber-400/40 active:scale-95 sm:px-4 sm:py-2"
      : "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-[#0B3D91] border border-[#0B3D91]/25 transition-all hover:bg-blue-50 hover:border-[#0B3D91]/50 active:scale-95 sm:px-4 sm:py-2";

    return (
      <header className={headerClass}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between sm:h-16 lg:h-[4.5rem]">
            {/* ── Logo ── */}
            {Logo}

            {/* ── Single Home button ── */}
            <Link href="/" id="nav-home-only" className={homeBtn}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 shrink-0"
              >
                <path d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                <path d="M9 22V12h6v10" />
              </svg>
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     FULL NAVBAR MODE  (home page)
  ══════════════════════════════════════════════════════════════ */
  const linkClass = isDark
    ? "rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white xl:px-4"
    : "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#0B3D91] xl:px-4";

  const mobileLinkClass = isDark
    ? "block px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
    : "block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0B3D91]";

  const burgerClass = isDark
    ? "rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white lg:hidden"
    : "rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden";

  const mobileMenuClass = isDark
    ? `overflow-hidden border-t border-white/10 transition-all duration-300 lg:hidden ${
        menuOpen ? "max-h-screen opacity-100 bg-[rgba(4,13,32,0.95)] backdrop-blur-xl" : "max-h-0 opacity-0"
      }`
    : `overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 lg:hidden ${
        menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
      }`;

  const signInDesktopClass = isDark
    ? "rounded-lg px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
    : "rounded-lg px-4 py-2 text-sm font-semibold text-[#0B3D91] transition-all hover:bg-blue-50";

  const signInMobileClass = isDark
    ? "block text-center py-2.5 rounded-lg border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/10"
    : "block text-center py-2.5 rounded-lg border border-[#0B3D91]/30 text-[#0B3D91] font-semibold text-sm";

  return (
    <header className={headerClass}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-[4.5rem]">

          {/* ── Logo ── */}
          {Logo}

          {/* ── Desktop nav links ── */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className={linkClass}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* ── Desktop CTA buttons ── */}
          <div className="hidden items-center gap-3 lg:flex">
            {!hideSignIn && (
              <Link href="/login" id="nav-sign-in" className={signInDesktopClass}>
                Sign In
              </Link>
            )}
            <Link
              href="/register"
              id="nav-register"
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-400/30 transition-all hover:bg-amber-300 hover:shadow-amber-400/50 active:scale-95"
            >
              Verify
            </Link>
          </div>

          {/* ── Mobile burger ── */}
          <button
            id="mobile-menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={burgerClass}
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

      {/* ── Mobile / Tablet dropdown ── */}
      <div className={mobileMenuClass} aria-hidden={!menuOpen}>
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={mobileLinkClass}
            >
              {l.label}
            </a>
          ))}
          <div
            className={`pt-3 pb-1 flex flex-col gap-2 mt-2 ${
              isDark ? "border-t border-white/10" : "border-t border-slate-100"
            }`}
          >
            {!hideSignIn && (
              <Link
                href="/login"
                id="mobile-sign-in"
                onClick={() => setMenuOpen(false)}
                className={signInMobileClass}
              >
                Sign In
              </Link>
            )}
            <Link
              href="/register"
              id="mobile-register"
              onClick={() => setMenuOpen(false)}
              className="block text-center py-2.5 rounded-xl bg-amber-400 text-slate-900 font-bold text-sm hover:bg-amber-300 transition-all"
            >
              Verify
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
