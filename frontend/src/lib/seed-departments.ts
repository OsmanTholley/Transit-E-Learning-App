/**
 * Previously held seed/demo department names that were pre-populated.
 * All hardcoded seed departments have been removed — the admin creates
 * all departments through the UI. This file is kept only for compatibility.
 */
export const SEED_DEPARTMENT_NAMES: readonly string[] = [];

export function isSeedDepartmentName(name: string): boolean {
  void name;
  return false;
}
