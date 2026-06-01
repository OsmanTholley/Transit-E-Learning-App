import { prisma } from "@/lib/prisma";
import {
  computeAttendancePercent,
  getClassDurationSeconds,
  statusFromPercent,
} from "@/lib/live-classroom/attendance";
import { buildRoomName } from "@/lib/live-classroom/livekit";
import type { LiveClassStatus } from "@prisma/client";

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

function mapLiveClass(
  c: {
    id: string;
    title: string | null;
    status: LiveClassStatus;
    roomName: string | null;
    recordingUrl: string | null;
    startTime: Date | null;
    endTime: Date | null;
    actualStart: Date | null;
    actualEnd: Date | null;
    course: { courseCode: string; courseTitle: string } | null;
    lecturer: { user: { fullName: string } } | null;
  },
  role: "student" | "lecturer" | "admin"
): LiveClassListItem {
  const basePath =
    role === "lecturer"
      ? "/lecturer/live-classroom"
      : role === "admin"
        ? "/admin/live-classroom"
        : "/student/live-classroom";

  return {
    id: c.id,
    title: c.title ?? c.course?.courseTitle ?? "Live Class",
    courseCode: c.course?.courseCode ?? "—",
    courseTitle: c.course?.courseTitle ?? "—",
    lecturerName: c.lecturer?.user.fullName ?? "—",
    status: c.status,
    startTime: c.startTime?.toISOString() ?? null,
    endTime: c.endTime?.toISOString() ?? null,
    actualStart: c.actualStart?.toISOString() ?? null,
    actualEnd: c.actualEnd?.toISOString() ?? null,
    roomName: c.roomName,
    recordingUrl: c.recordingUrl,
    meetingPath: `${basePath}/${c.id}`,
  };
}

const liveClassInclude = {
  course: { select: { courseCode: true, courseTitle: true } },
  lecturer: { include: { user: { select: { fullName: true } } } },
} as const;

export async function listLecturerLiveClasses(lecturerId: string) {
  const rows = await prisma.liveClass.findMany({
    where: { lecturerId },
    orderBy: { startTime: "desc" },
    include: liveClassInclude,
  });
  return rows.map((c) => mapLiveClass(c, "lecturer"));
}

export async function listStudentLiveClasses(studentId: string) {
  const enrollments = await prisma.courseStudent.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  const rows = await prisma.liveClass.findMany({
    where: { courseId: { in: courseIds }, status: { not: "CANCELLED" } },
    orderBy: { startTime: "asc" },
    include: liveClassInclude,
  });
  return rows.map((c) => mapLiveClass(c, "student"));
}

export async function listAllLiveClasses() {
  const rows = await prisma.liveClass.findMany({
    orderBy: { startTime: "desc" },
    take: 100,
    include: liveClassInclude,
  });
  return rows.map((c) => mapLiveClass(c, "admin"));
}

export async function scheduleLiveClass(params: {
  lecturerId: string;
  courseId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}) {
  const course = await prisma.course.findFirst({
    where: { id: params.courseId, lecturerId: params.lecturerId },
  });
  if (!course) return null;

  const created = await prisma.liveClass.create({
    data: {
      lecturerId: params.lecturerId,
      courseId: params.courseId,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      status: "SCHEDULED",
      startTime: params.startTime,
      endTime: params.endTime,
      meetingLink: `/lecturer/live-classroom`,
    },
  });

  const roomName = buildRoomName(created.id);
  return prisma.liveClass.update({
    where: { id: created.id },
    data: { roomName },
    include: liveClassInclude,
  });
}

export async function startLiveClass(classId: string, lecturerId: string) {
  const live = await prisma.liveClass.findFirst({
    where: { id: classId, lecturerId },
  });
  if (!live) return null;

  return prisma.liveClass.update({
    where: { id: classId },
    data: {
      status: "LIVE",
      actualStart: live.actualStart ?? new Date(),
    },
    include: liveClassInclude,
  });
}

export async function endLiveClass(classId: string, lecturerId: string) {
  const live = await prisma.liveClass.findFirst({
    where: { id: classId, lecturerId },
    include: { attendanceLogs: true },
  });
  if (!live) return null;

  const now = new Date();
  const classDuration = getClassDurationSeconds(
    live.actualStart,
    now,
    live.startTime,
    live.endTime
  );

  await prisma.$transaction(async (tx) => {
    for (const log of live.attendanceLogs) {
      const exitTime = log.exitTime ?? now;
      const durationSeconds = log.exitTime
        ? log.durationSeconds
        : Math.floor((exitTime.getTime() - log.joinTime.getTime()) / 1000);
      const percent = computeAttendancePercent(durationSeconds, classDuration);
      const status = statusFromPercent(percent);

      await tx.liveClassAttendanceLog.update({
        where: { id: log.id },
        data: {
          exitTime,
          durationSeconds,
          attendancePercent: percent,
          status,
        },
      });

      const existing = await tx.attendance.findFirst({
        where: { classId: live.id, studentId: log.studentId },
      });
      if (existing) {
        await tx.attendance.update({
          where: { id: existing.id },
          data: { status, markedAt: now },
        });
      } else {
        await tx.attendance.create({
          data: {
            classId: live.id,
            studentId: log.studentId,
            status,
            markedAt: now,
          },
        });
      }
    }

    await tx.liveClass.update({
      where: { id: classId },
      data: { status: "ENDED", actualEnd: now },
    });
  });

  return prisma.liveClass.findUnique({
    where: { id: classId },
    include: liveClassInclude,
  });
}

export async function recordStudentJoin(params: {
  liveClassId: string;
  studentId: string;
}) {
  const live = await prisma.liveClass.findFirst({
    where: { id: params.liveClassId, status: { in: ["SCHEDULED", "LIVE"] } },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
    },
  });
  if (!live?.course) return null;

  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    include: { user: { select: { fullName: true } } },
  });
  if (!student) return null;

  const enrolled = await prisma.courseStudent.findFirst({
    where: { studentId: params.studentId, courseId: live.courseId! },
  });
  if (!enrolled) return null;

  const now = new Date();

  if (live.status === "SCHEDULED") {
    await prisma.liveClass.update({
      where: { id: live.id },
      data: { status: "LIVE", actualStart: live.actualStart ?? now },
    });
  }

  return prisma.liveClassAttendanceLog.upsert({
    where: {
      liveClassId_studentId: {
        liveClassId: live.id,
        studentId: student.id,
      },
    },
    create: {
      liveClassId: live.id,
      studentId: student.id,
      studentIdCode: student.studentId,
      studentName: student.user.fullName,
      courseCode: live.course.courseCode,
      courseTitle: live.course.courseTitle,
      joinTime: now,
      status: "ABSENT",
    },
    update: {},
  });
}

export async function recordStudentHeartbeat(params: {
  liveClassId: string;
  studentId: string;
}) {
  const log = await prisma.liveClassAttendanceLog.findUnique({
    where: {
      liveClassId_studentId: {
        liveClassId: params.liveClassId,
        studentId: params.studentId,
      },
    },
  });
  if (!log) return null;

  const live = await prisma.liveClass.findUnique({ where: { id: params.liveClassId } });
  if (!live) return null;

  const now = new Date();
  const durationSeconds = Math.floor((now.getTime() - log.joinTime.getTime()) / 1000);
  const classDuration = getClassDurationSeconds(
    live.actualStart,
    live.actualEnd,
    live.startTime,
    live.endTime
  );
  const percent = computeAttendancePercent(durationSeconds, classDuration);
  const status = statusFromPercent(percent);

  return prisma.liveClassAttendanceLog.update({
    where: { id: log.id },
    data: { durationSeconds, attendancePercent: percent, status },
  });
}

export async function recordStudentLeave(params: {
  liveClassId: string;
  studentId: string;
}) {
  const log = await prisma.liveClassAttendanceLog.findUnique({
    where: {
      liveClassId_studentId: {
        liveClassId: params.liveClassId,
        studentId: params.studentId,
      },
    },
  });
  if (!log) return null;

  const live = await prisma.liveClass.findUnique({ where: { id: params.liveClassId } });
  if (!live) return null;

  const now = new Date();
  const durationSeconds = Math.floor((now.getTime() - log.joinTime.getTime()) / 1000);
  const classDuration = getClassDurationSeconds(
    live.actualStart,
    live.actualEnd ?? now,
    live.startTime,
    live.endTime
  );
  const percent = computeAttendancePercent(durationSeconds, classDuration);
  const status = statusFromPercent(percent);

  return prisma.liveClassAttendanceLog.update({
    where: { id: log.id },
    data: {
      exitTime: now,
      durationSeconds,
      attendancePercent: percent,
      status,
    },
  });
}
