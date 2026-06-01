/** Canonical academic year labels stored in the database and shown in the UI. */
export const ACADEMIC_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"] as const;

export type AcademicYear = (typeof ACADEMIC_YEARS)[number];

const LEGACY_LEVEL_TO_YEAR: Record<string, AcademicYear> = {
  "100": "Year 1",
  "200": "Year 2",
  "300": "Year 3",
  "400": "Year 4",
  "1": "Year 1",
  "2": "Year 2",
  "3": "Year 3",
  "4": "Year 4",
};

/** Normalize legacy values (100, 200, …) to canonical Year labels for storage. */
export function normalizeAcademicYear(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const legacy = LEGACY_LEVEL_TO_YEAR[trimmed];
  if (legacy) return legacy;
  const yearMatch = trimmed.match(/^year\s*(\d+)$/i);
  if (yearMatch) {
    const n = Number(yearMatch[1]);
    if (n >= 1 && n <= 4) return `Year ${n}`;
  }
  if ((ACADEMIC_YEARS as readonly string[]).includes(trimmed)) return trimmed;
  return trimmed;
}

/** Format a stored level for display (handles legacy DB values). */
export function formatAcademicYear(value: string | null | undefined): string {
  return normalizeAcademicYear(value) ?? "—";
}

export const ACADEMIC_YEARS_SUMMARY = "Year 1–Year 4";

const YEAR_LEGACY_CODES: Record<AcademicYear, string[]> = {
  "Year 1": ["100"],
  "Year 2": ["200"],
  "Year 3": ["300"],
  "Year 4": ["400"],
};

/** Values that may appear in `students.level` for a given year label. */
export function academicYearDbVariants(value: string | null | undefined): string[] {
  const normalized = normalizeAcademicYear(value);
  if (!normalized) return [];
  const set = new Set<string>([normalized]);
  const raw = value?.trim();
  if (raw) set.add(raw);
  for (const code of YEAR_LEGACY_CODES[normalized as AcademicYear] ?? []) {
    set.add(code);
  }
  return [...set];
}
