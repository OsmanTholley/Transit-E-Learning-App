import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LiveClassAttendanceRow = {
  id: string;
  studentIdCode: string;
  studentName: string;
  role: string;
  courseCode: string;
  courseTitle: string;
  joinTime: string;
  exitTime: string | null;
  durationSeconds: number;
  durationLabel: string;
  attendancePercent: number;
  status: AttendanceStatus;
  isOnline: boolean;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function getLiveClassAttendanceDashboard(liveClassId: string) {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { fullName: true, role: true } } } },
      createdBy: { select: { fullName: true, role: true } },
    },
  });

  if (!liveClass) return null;

  const logs = await prisma.liveClassAttendanceLog.findMany({
    where: { liveClassId },
    orderBy: [{ status: "asc" }, { joinTime: "asc" }],
  });

  const registeredCount = liveClass.courseId
    ? await prisma.courseStudent.count({ where: { courseId: liveClass.courseId } })
    : logs.length;

  const attendees = logs.filter((log) => log.status !== AttendanceStatus.ABSENT);
  const onlineCount = logs.filter((log) => !log.exitTime).length;

  const hostName =
    liveClass.lecturer?.user.fullName ??
    liveClass.createdBy?.fullName ??
    "Host";
  const hostRole = liveClass.lecturer?.user.role ?? liveClass.createdBy?.role ?? "LECTURER";

  const rows: LiveClassAttendanceRow[] = logs.map((log) => ({
    id: log.id,
    studentIdCode: log.studentIdCode,
    studentName: log.studentName,
    role: "Student",
    courseCode: log.courseCode,
    courseTitle: log.courseTitle,
    joinTime: log.joinTime.toISOString(),
    exitTime: log.exitTime?.toISOString() ?? null,
    durationSeconds: log.durationSeconds,
    durationLabel: formatDuration(log.durationSeconds),
    attendancePercent: log.attendancePercent,
    status: log.status,
    isOnline: !log.exitTime,
  }));

  const present = rows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const late = rows.filter((r) => r.status === AttendanceStatus.LATE).length;
  const absent = Math.max(0, registeredCount - attendees.length);
  const attendancePercentage =
    registeredCount > 0 ? Math.round((attendees.length / registeredCount) * 100) : 0;

  return {
    session: {
      id: liveClass.id,
      title: liveClass.title,
      status: liveClass.status,
      hostName,
      hostRole,
      courseCode: liveClass.course?.courseCode ?? null,
      courseTitle: liveClass.course?.courseTitle ?? null,
      startTime: liveClass.actualStart?.toISOString() ?? liveClass.startTime?.toISOString() ?? null,
      endTime: liveClass.actualEnd?.toISOString() ?? liveClass.endTime?.toISOString() ?? null,
    },
    summary: {
      totalRegistered: registeredCount,
      totalAttendees: attendees.length,
      totalAbsent: absent,
      totalLate: late,
      totalPresent: present,
      attendancePercentage,
      currentOnline: onlineCount,
    },
    rows,
  };
}

export function buildAttendanceReportHtml(
  dashboard: NonNullable<Awaited<ReturnType<typeof getLiveClassAttendanceDashboard>>>,
) {
  const generatedAt = new Date().toLocaleString("en-GB");
  const rowsHtml = dashboard.rows
    .map(
      (row) => `
      <tr>
        <td>${row.studentName}</td>
        <td>${row.studentIdCode}</td>
        <td>${row.role}</td>
        <td>${new Date(row.joinTime).toLocaleString("en-GB")}</td>
        <td>${row.exitTime ? new Date(row.exitTime).toLocaleString("en-GB") : "—"}</td>
        <td>${row.durationLabel}</td>
        <td>${row.attendancePercent}%</td>
        <td>${row.status}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Attendance Report — ${dashboard.session.title ?? "Live Session"}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; }
    h1 { color: #0B3D91; margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 24px; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
    .card strong { display: block; font-size: 20px; color: #0B3D91; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Attendance Report</h1>
  <p class="meta">
    ${dashboard.session.title ?? "Live Session"} · Hosted by ${dashboard.session.hostName} (${dashboard.session.hostRole})<br />
    Generated ${generatedAt}
  </p>
  <div class="summary">
    <div class="card"><span>Registered</span><strong>${dashboard.summary.totalRegistered}</strong></div>
    <div class="card"><span>Attendees</span><strong>${dashboard.summary.totalAttendees}</strong></div>
    <div class="card"><span>Absent</span><strong>${dashboard.summary.totalAbsent}</strong></div>
    <div class="card"><span>Late</span><strong>${dashboard.summary.totalLate}</strong></div>
    <div class="card"><span>Attendance %</span><strong>${dashboard.summary.attendancePercentage}%</strong></div>
    <div class="card"><span>Online now</span><strong>${dashboard.summary.currentOnline}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Student ID</th><th>Role</th><th>Join</th><th>Leave</th><th>Duration</th><th>%</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || `<tr><td colspan="8">No attendance records yet.</td></tr>`}</tbody>
  </table>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export function buildAttendanceCsv(
  dashboard: NonNullable<Awaited<ReturnType<typeof getLiveClassAttendanceDashboard>>>,
) {
  const header = ["Name", "Student ID", "Role", "Join Time", "Leave Time", "Duration", "Percent", "Status"];
  const lines = dashboard.rows.map((row) =>
    [
      row.studentName,
      row.studentIdCode,
      row.role,
      row.joinTime,
      row.exitTime ?? "",
      row.durationLabel,
      row.attendancePercent,
      row.status,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
