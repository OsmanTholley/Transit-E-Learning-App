import { AdminShell } from "@/components/admin/admin-shell";
import { AdminLiveClassroomDashboard } from "@/components/live-classroom/admin-dashboard";

export default function AdminLiveClassroomPage() {
  return (
    <AdminShell pageTitle="Live Classroom" subtitle="Attendance analytics and session monitoring.">
      <AdminLiveClassroomDashboard />
    </AdminShell>
  );
}
