import type { AttendanceStatus, LiveClassStatus } from "@prisma/client";

export type LiveClassListItem = {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  status: LiveClassStatus;
  startTime: string | null;
  endTime: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  roomName: string | null;
  recordingUrl: string | null;
  meetingPath: string;
};

export type AttendanceLogRow = {
  id: string;
  studentIdCode: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  joinTime: string;
  exitTime: string | null;
  durationSeconds: number;
  attendancePercent: number;
  status: AttendanceStatus;
  statusLabel: string;
};

export type LiveClassAnalytics = {
  totalSessions: number;
  liveNow: number;
  upcoming: number;
  averageAttendance: number;
  presentCount: number;
  partialCount: number;
  absentCount: number;
};

export type ChatMessagePayload = {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
};

export type PollPayload = {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  votes?: number[];
};
