/** Canonical semester labels used across student and course records. */
export const ACADEMIC_SEMESTERS = ["First", "Second"] as const;

const LEGACY_SEMESTER_MAP: Record<string, (typeof ACADEMIC_SEMESTERS)[number]> = {
  first: "First",
  "semester 1": "First",
  "semester1": "First",
  "1": "First",
  second: "Second",
  "semester 2": "Second",
  "semester2": "Second",
  "2": "Second",
};

export function normalizeSemester(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const legacy = LEGACY_SEMESTER_MAP[trimmed.toLowerCase()];
  if (legacy) return legacy;
  if ((ACADEMIC_SEMESTERS as readonly string[]).includes(trimmed)) return trimmed;
  return trimmed;
}

export function semestersMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeSemester(left);
  const b = normalizeSemester(right);
  if (!a || !b) return true;
  return a === b;
}

export function semesterDbVariants(value: string | null | undefined): string[] {
  const normalized = normalizeSemester(value);
  if (!normalized) return [];
  const set = new Set<string>([normalized]);
  const raw = value?.trim();
  if (raw) set.add(raw);
  if (normalized === "First") {
    set.add("Semester 1");
    set.add("1");
  }
  if (normalized === "Second") {
    set.add("Semester 2");
    set.add("2");
  }
  return [...set];
}
