import { requireAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser();
  if (!admin) {
    redirect("/login?role=staff");
  }

  return <AdminDashboard adminName={admin.fullName} />;
}
