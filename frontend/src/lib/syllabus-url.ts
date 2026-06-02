/** Syllabus may be an external URL or an uploaded path under /uploads/. */
export function isValidSyllabusRef(value: string) {
  const v = value.trim();
  if (!v) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith("/uploads/")) return true;
  return false;
}
