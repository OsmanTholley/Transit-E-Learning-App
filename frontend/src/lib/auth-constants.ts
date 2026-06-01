import type { AppRole } from "@/types/app";

export const AUTH_ROLE_COOKIE = "transit_role";
export const AUTH_USER_COOKIE = "transit_user_id";

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "student" || value === "lecturer" || value === "admin";
}
