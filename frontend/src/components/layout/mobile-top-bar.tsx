"use client";

import { TransitLogo } from "@/components/brand/transit-logo";

export function MobileTopBar({
  onMenuClick,
  title,
}: {
  onMenuClick: () => void;
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1 truncate text-center">
        {title ? (
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        ) : (
          <TransitLogo size="sm" variant="dark" subtitle="E-Learning" />
        )}
      </div>
      <div className="w-10" aria-hidden />
    </header>
  );
}

export function MobileNavOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <button
      type="button"
      className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
      aria-label="Close menu"
      onClick={onClose}
    />
  );
}
