import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DatabaseUnavailable } from "@/components/database-unavailable";
import { StudentShell } from "@/components/student/student-shell";
import { StudentSessionProvider } from "@/contexts/student-session-context";
import { DatabaseUnavailableError, validateStudentSession } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  let user;
  try {
    user = await validateStudentSession();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseUnavailable />;
    }
    throw error;
  }

  if (!user) {
    redirect("/login?role=student");
  }

  return (
    <StudentSessionProvider>
      <StudentShell>{children}</StudentShell>
    </StudentSessionProvider>
  );
}
