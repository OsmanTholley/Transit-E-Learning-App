import { AppShell } from "@/components/app-shell";
import { LecturerLiveClassroomDashboard } from "@/components/live-classroom/lecturer-dashboard";

export default function LecturerLiveClassroomPage() {
  return (
    <AppShell
      role="lecturer"
      pageTitle="Live Classroom"
      subtitle="Schedule and run live classes with attendance analytics."
    >
      <LecturerLiveClassroomDashboard />
    </AppShell>
  );
}
