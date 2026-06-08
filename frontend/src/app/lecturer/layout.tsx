import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LecturerShell } from "@/components/lecturer/lecturer-shell";
import { DatabaseUnavailable } from "@/components/database-unavailable";
import { DatabaseUnavailableError, requireLecturerUser } from "@/lib/auth";

export default async function LecturerLayout({ children }: { children: ReactNode }) {
  try {
    const lecturer = await requireLecturerUser();
    if (!lecturer) {
      redirect("/login?role=staff");
    }

    return (
      <LecturerShell
        lecturerName={lecturer.fullName}
        lecturerEmail={lecturer.email ?? ""}
        profileImage={lecturer.profileImage}
      >
        {children}
      </LecturerShell>
    );
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseUnavailable />;
    }
    throw error;
  }
}
