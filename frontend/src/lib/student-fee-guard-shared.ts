export const FEE_LOCK_MESSAGES = {
  live: "Please complete payment to regain access to live sessions and virtual rooms.",
  materials: "Please complete payment to regain access to learning materials, notes, and downloads.",
  videos: "Please complete payment to regain access to video lessons and recorded content.",
  general: "Please complete payment to regain access.",
} as const;

export type FeeLockContext = keyof typeof FEE_LOCK_MESSAGES;

export type FeeLockPayload = {
  feeTitle?: string;
  requiredPercent: number;
  requiredAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueDate: string | null;
  status: string;
};

/** Paths students may visit while fee-restricted (billing, profile, notifications). */
export const FEE_EXEMPT_STUDENT_PATHS = [
  "/student/billing",
  "/student/profile",
  "/student/settings",
] as const;

const FEE_PROTECTED_PREFIXES = [
  "/student/courses",
  "/student/video-lessons",
  "/student/live-classes",
  "/student/lecture-notes",
  "/student/assignments",
  "/student/quizzes",
  "/student/discussions",
  "/student/ai-tutor",
] as const;

export function isFeeExemptStudentPath(pathname: string): boolean {
  return FEE_EXEMPT_STUDENT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isFeeProtectedStudentPath(pathname: string): boolean {
  if (isFeeExemptStudentPath(pathname)) return false;
  return FEE_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function feeContextForPath(pathname: string): FeeLockContext {
  if (pathname.startsWith("/student/live-classes")) return "live";
  if (pathname.startsWith("/student/video-lessons")) return "videos";
  if (
    pathname.startsWith("/student/lecture-notes") ||
    pathname.startsWith("/student/courses") ||
    pathname.startsWith("/student/assignments")
  ) {
    return "materials";
  }
  return "general";
}
