import type { AttendanceStatus } from "@prisma/client";

/** Class length in seconds used for attendance percentage. */
export function getClassDurationSeconds(
  actualStart: Date | null | undefined,
  actualEnd: Date | null | undefined,
  scheduledStart: Date | null | undefined,
  scheduledEnd: Date | null | undefined
): number {
  const start = actualStart ?? scheduledStart;
  const end = actualEnd ?? scheduledEnd ?? (start ? new Date() : null);
  if (!start || !end) return 3600;
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  return Math.max(seconds, 60);
}

export function computeAttendancePercent(
  durationSeconds: number,
  classDurationSeconds: number
): number {
  if (classDurationSeconds <= 0) return 0;
  return Math.min(100, Math.round((durationSeconds / classDurationSeconds) * 100));
}

/** ≥80% Present, 50–79% Partial, <50% Absent */
export function statusFromPercent(percent: number): AttendanceStatus {
  if (percent >= 80) return "PRESENT";
  if (percent >= 50) return "PARTIAL";
  return "ABSENT";
}

export function formatAttendanceStatus(status: AttendanceStatus): string {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "PARTIAL":
      return "Partial Attendance";
    case "LATE":
      return "Late";
    default:
      return "Absent";
  }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
