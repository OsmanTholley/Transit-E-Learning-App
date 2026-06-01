import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DatabaseUnavailable } from "@/components/database-unavailable";
import { DatabaseUnavailableError, requireLecturerUser } from "@/lib/auth";

export default async function LecturerLayout({ children }: { children: ReactNode }) {
  try {
    const lecturer = await requireLecturerUser();
    if (!lecturer) {
      redirect("/login");
    }

    return children;
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseUnavailable />;
    }
    throw error;
  }
}
