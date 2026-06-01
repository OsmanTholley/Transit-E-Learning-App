export const STUDENT_ID_PREFIX = "TCSL/";

/** Official format: TCSL/001, TCSL/002, … */
export const STUDENT_ID_PATTERN = /^TCSL\/\d{3,}$/;

export function formatStudentIdNumber(numberPart: string | number): string {
  const num =
    typeof numberPart === "number"
      ? numberPart
      : parseInt(String(numberPart).replace(/\D/g, ""), 10);

  if (!Number.isFinite(num) || num < 1) {
    return "";
  }

  return `${STUDENT_ID_PREFIX}${String(num).padStart(3, "0")}`;
}

/** Accepts TCSL/001, TCSL/1, or 001 and returns canonical TCSL/001. */
export function normalizeStudentId(input: string): string {
  const trimmed = input.trim().toUpperCase();

  if (!trimmed) {
    return "";
  }

  if (STUDENT_ID_PATTERN.test(trimmed)) {
    const num = trimmed.slice(STUDENT_ID_PREFIX.length);
    return formatStudentIdNumber(num);
  }

  if (trimmed.startsWith(STUDENT_ID_PREFIX)) {
    const num = trimmed.slice(STUDENT_ID_PREFIX.length).replace(/\D/g, "");
    return formatStudentIdNumber(num);
  }

  if (/^TCSL\d+$/i.test(trimmed)) {
    const num = trimmed.replace(/^TCSL/i, "");
    return formatStudentIdNumber(num);
  }

  if (/^\d+$/.test(trimmed)) {
    return formatStudentIdNumber(trimmed);
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

export function getNextStudentId(existingIds: string[]): string {
  let max = 0;

  for (const id of existingIds) {
    const normalized = normalizeStudentId(id);
    const num = parseStudentIdNumber(normalized);
    if (num !== null && num > max) {
      max = num;
    }
  }

  return formatStudentIdNumber(max + 1);
}
