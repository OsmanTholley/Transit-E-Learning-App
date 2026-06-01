import { cookies } from "next/headers";
import { AUTH_ROLE_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth-constants";

export { AUTH_ROLE_COOKIE, AUTH_USER_COOKIE };

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_USER_COOKIE)?.value ?? null;
}

export async function getSessionRole(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_ROLE_COOKIE)?.value ?? null;
}
