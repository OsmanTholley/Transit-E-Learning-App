export const STUDENT_ID_PREFIX = "TCSL/";

/** Official format: TCSL/ followed by one or more digits (e.g. TCSL/1, TCSL/001, TCSL/0001). */
export const STUDENT_ID_PATTERN = /^TCSL\/\d+$/;

export const STUDENT_ID_FORMAT_HINT = "TCSL/ followed by numbers (e.g. TCSL/0001)";

export function formatStudentIdNumber(numberPart: string | number): string {
  const raw =
    typeof numberPart === "number"
      ? String(numberPart)
      : String(numberPart).replace(/\D/g, "");

  if (!raw || !/^\d+$/.test(raw)) {
    return "";
  }

  return `${STUDENT_ID_PREFIX}${raw}`;
}

/** Accepts TCSL/0001, TCSL/1, TCSL001, or 0001 and returns TCSL/0001. */
export function normalizeStudentId(input: string): string {
  const trimmed = input.trim().toUpperCase();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith(STUDENT_ID_PREFIX)) {
    const numPart = trimmed.slice(STUDENT_ID_PREFIX.length).replace(/\D/g, "");
    return numPart ? `${STUDENT_ID_PREFIX}${numPart}` : "";
  }

  if (/^TCSL\d+$/i.test(trimmed)) {
    const numPart = trimmed.slice(4).replace(/\D/g, "");
    return numPart ? `${STUDENT_ID_PREFIX}${numPart}` : "";
  }

  if (/^\d+$/.test(trimmed)) {
    return `${STUDENT_ID_PREFIX}${trimmed}`;
  }

  return "";
}

export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_PATTERN.test(id);
}

export function parseStudentIdNumber(id: string): number | null {
  const match = id.match(/^TCSL\/(\d+)$/);
  if (!match) {
    return null;
  }
  const num = parseInt(match[1], 10);
  return Number.isFinite(num) ? num : null;
}

/** Lookup variants so TCSL/1 and TCSL/001 resolve to the same student when possible. */
export function studentIdLookupCandidates(input: string): string[] {
  const normalized = normalizeStudentId(input);
  if (!normalized || !isValidStudentId(normalized)) {
    return [];
  }

  const candidates = new Set<string>([normalized]);
  const num = parseStudentIdNumber(normalized);
  if (num !== null) {
    candidates.add(`${STUDENT_ID_PREFIX}${num}`);
    candidates.add(`${STUDENT_ID_PREFIX}${String(num).padStart(3, "0")}`);
    candidates.add(`${STUDENT_ID_PREFIX}${String(num).padStart(4, "0")}`);
  }

  return [...candidates];
}

export function getNextStudentId(existingIds: string[]): string {
  let max = 0;

  for (const id of existingIds) {
    const normalized = normalizeStudentId(id);
    const num = parseStudentIdNumber(normalized);
    if (num !== null && num > max) {
      max = num;
    }
  }

  return `${STUDENT_ID_PREFIX}${String(max + 1).padStart(4, "0")}`;
}
