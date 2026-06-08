import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DatabaseUnavailable } from "@/components/database-unavailable";
import { DatabaseUnavailableError, requireAdminUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseUnavailable />;
    }
    throw error;
  }

  if (!admin) {
    redirect("/login?role=staff");
  }

  return (
    <AdminShell
      adminName={admin.fullName}
      adminEmail={admin.email ?? ""}
      profileImage={admin.profileImage}
    >
      {children}
    </AdminShell>
  );
}
