"use client";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-11 w-11",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`relative shrink-0 ${spinnerSizes[size]} ${className}`}
    >
      <span className="absolute inset-0 rounded-full border-2 border-slate-200/80" />
      <span className="portal-spinner absolute inset-0 rounded-full border-2 border-transparent" />
    </div>
  );
}

export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="loading-dot h-1.5 w-1.5 rounded-full bg-[var(--portal-accent)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

type LoadingStateProps = {
  message?: string;
  minHeight?: number | string;
  panel?: boolean;
  layout?: "inline" | "centered" | "compact";
  className?: string;
  spinnerSize?: SpinnerSize;
};

export function LoadingState({
  message = "Loading…",
  minHeight,
  panel = false,
  layout = "centered",
  className = "",
  spinnerSize = "md",
}: LoadingStateProps) {
  const content =
    layout === "inline" ? (
      <div className="flex items-center gap-3">
        <LoadingSpinner size={spinnerSize} />
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </div>
    ) : layout === "compact" ? (
      <div className="flex flex-col items-center gap-2 py-2">
        <LoadingSpinner size="sm" />
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={spinnerSize} />
        {message ? <p className="text-sm font-medium text-slate-500">{message}</p> : null}
        <LoadingDots />
      </div>
    );

  const minH =
    minHeight != null ? (typeof minHeight === "number" ? `${minHeight}px` : minHeight) : undefined;

  const wrapperClass = [
    panel
      ? "flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm"
      : "flex items-center justify-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass} style={minH ? { minHeight: minH } : undefined}>
      {content}
    </div>
  );
}

export function LoadingGrid({
  count = 3,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`} role="status" aria-label="Loading content">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
          <div className="loading-shimmer h-36" />
          <div className="space-y-3 p-4">
            <div className="loading-shimmer h-4 w-2/3 rounded-lg" />
            <div className="loading-shimmer h-3 w-full rounded-lg" />
            <div className="loading-shimmer h-3 w-4/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingDashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="loading-shimmer h-36 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="loading-shimmer h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="loading-shimmer h-64 rounded-2xl" />
        <div className="loading-shimmer h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function LoadingTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table">
      <div className="loading-shimmer h-10 rounded-xl" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="loading-shimmer h-14 rounded-xl" />
      ))}
    </div>
  );
}

export function PageLoader({ message = "Loading page…" }: { message?: string }) {
  return <LoadingState message={message} minHeight="60vh" spinnerSize="lg" />;
}
