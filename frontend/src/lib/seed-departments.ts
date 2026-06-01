/** Default departments created by `prisma/seed.js` — excluded from admin-managed pickers. */
export const SEED_DEPARTMENT_NAMES = [
  "Computing Sciences",
  "Public Health",
  "Business",
  "Agriculture",
  "Mass Communication",
] as const;

export function isSeedDepartmentName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return SEED_DEPARTMENT_NAMES.some((seed) => seed.toLowerCase() === normalized);
}
