import { AttendanceStatus, LiveClassAudience, LiveClassStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const JITSI_DOMAIN = process.env.JITSI_DOMAIN?.trim() || "meet.jit.si";
export const LIVE_CLASS_LATE_JOIN_MINUTES = 10;
export const VIRTUAL_ROOM_MAX_PARTICIPANTS = 100;
export const ATTENDANCE_PRESENT_THRESHOLD = 75;
export const ATTENDANCE_PARTIAL_THRESHOLD = 40;

/** Mark scheduled sessions past end time as ended. Live sessions stay open until the host ends or extends. */
export async function expireStaleLiveClasses() {
  const now = new Date();
  const stale = await prisma.liveClass.findMany({
    where: {
      endTime: { lt: now },
      status: LiveClassStatus.SCHEDULED,
    },
    select: { id: true, actualStart: true, startTime: true },
  });

  if (stale.length === 0) return;

  await prisma.$transaction(
    stale.map((item) =>
      prisma.liveClass.update({
        where: { id: item.id },
        data: {
          status: LiveClassStatus.ENDED,
          actualEnd: now,
          actualStart: item.actualStart ?? item.startTime,
        },
      }),
    ),
  );
}

export function audienceAllowsRole(audience: LiveClassAudience, role: Role): boolean {
  if (audience === LiveClassAudience.GENERAL) return role === Role.STUDENT || role === Role.LECTURER;
  if (audience === LiveClassAudience.STUDENTS) return role === Role.STUDENT;
  if (audience === LiveClassAudience.LECTURERS) return role === Role.LECTURER;
  return false;
}

export async function extendLiveClassSession(liveClassId: string, minutes: number) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass) {
    throw new Error("Live class not found.");
  }
  if (liveClass.status !== LiveClassStatus.LIVE) {
    throw new Error("Only live sessions can be extended.");
  }

  const extraMs = Math.max(5, Math.min(240, minutes)) * 60 * 1000;
  const base = Math.max(Date.now(), liveClass.endTime?.getTime() ?? Date.now());

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: { endTime: new Date(base + extraMs) },
  });
}

async function canStudentJoinLiveClass(liveClassId: string, studentId: string, actualStart: Date | null) {
  if (!actualStart) {
    return { ok: true as const };
  }

  const msSinceStart = Date.now() - actualStart.getTime();
  if (msSinceStart <= LIVE_CLASS_LATE_JOIN_MINUTES * 60 * 1000) {
    return { ok: true as const };
  }

  const [existingLog, lateAdmit] = await Promise.all([
    prisma.liveClassAttendanceLog.findUnique({
      where: { liveClassId_studentId: { liveClassId, studentId } },
    }),
    prisma.liveClassLateAdmission.findUnique({
      where: { liveClassId_studentId: { liveClassId, studentId } },
    }),
  ]);

  if (existingLog || lateAdmit) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    error:
      "Entry closed 10 minutes after class started. Ask your lecturer to admit you from the classroom panel.",
    status: 403,
  };
}

export async function approveLateAdmission(liveClassId: string, lecturerId: string, studentId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass || liveClass.lecturerId !== lecturerId) {
    throw new Error("Live class not found.");
  }

  const enrolled = await prisma.courseStudent.findFirst({
    where: { studentId, courseId: liveClass.courseId ?? "" },
  });
  if (!enrolled) {
    throw new Error("Student is not enrolled in this course.");
  }

  return prisma.liveClassLateAdmission.upsert({
    where: { liveClassId_studentId: { liveClassId, studentId } },
    create: { liveClassId, studentId },
    update: { approvedAt: new Date() },
  });
}

export async function listLateAdmissionCandidates(liveClassId: string, lecturerId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass || liveClass.lecturerId !== lecturerId || !liveClass.courseId) {
    throw new Error("Live class not found.");
  }

  const [enrollments, admissions, attendance] = await Promise.all([
    prisma.courseStudent.findMany({
      where: { courseId: liveClass.courseId },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
    }),
    prisma.liveClassLateAdmission.findMany({ where: { liveClassId } }),
    prisma.liveClassAttendanceLog.findMany({ where: { liveClassId }, select: { studentId: true } }),
  ]);

  const admittedIds = new Set(admissions.map((row) => row.studentId));
  const joinedIds = new Set(attendance.map((row) => row.studentId));

  return enrollments
    .map(({ student }) => ({
      id: student.id,
      studentId: student.studentId,
      fullName: student.user.fullName,
      admitted: admittedIds.has(student.id),
      joined: joinedIds.has(student.id),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function isLateJoinWindowClosed(actualStart: Date | null): Promise<boolean> {
  if (!actualStart) return false;
  return Date.now() - actualStart.getTime() > LIVE_CLASS_LATE_JOIN_MINUTES * 60 * 1000;
}

export type LiveClassSessionAs = "lecturer" | "student";

export async function getLiveClassAccess(
  liveClassId: string,
  userId: string,
  role: Role,
  options?: { sessionAs?: LiveClassSessionAs },
) {
  await expireStaleLiveClasses();

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { id: true, fullName: true, role: true } } } },
      createdBy: { select: { id: true, fullName: true, role: true } },
    },
  });

  if (!liveClass) {
    return { ok: false as const, error: "Live class not found.", status: 404 };
  }

  if (liveClass.status === LiveClassStatus.ENDED || liveClass.status === LiveClassStatus.CANCELLED) {
    return { ok: false as const, error: "This class has ended.", status: 410 };
  }

  if (role === Role.ADMIN) {
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });
    const adminName = adminUser?.fullName ?? "Admin";

    return {
      ok: true as const,
      liveClass,
      isLecturer: true,
      isModerator: true,
      isAdmin: true,
      isObserver: true,
      displayName: `${adminName} (Administrator)`,
    };
  }

  if (role === Role.LECTURER) {
    const lecturer = await prisma.lecturer.findFirst({
      where: { userId },
      include: { user: { select: { fullName: true } } },
    });
    if (!lecturer) {
      return { ok: false as const, error: "Unauthorized.", status: 401 };
    }

    if (liveClass.lecturerId === lecturer.id) {
      return {
        ok: true as const,
        liveClass,
        lecturer,
        isLecturer: true,
        isModerator: true,
        displayName: lecturer.user.fullName,
      };
    }

    if (
      !liveClass.lecturerId &&
      !liveClass.courseId &&
      audienceAllowsRole(liveClass.audience, Role.LECTURER)
    ) {
      if (liveClass.status !== LiveClassStatus.LIVE) {
        return {
          ok: false as const,
          error: "This session has not started yet.",
          status: 403,
        };
      }
      return {
        ok: true as const,
        liveClass,
        lecturer,
        isLecturer: false,
        isModerator: false,
        displayName: lecturer.user.fullName,
      };
    }

    return { ok: false as const, error: "You are not allowed to join this session.", status: 403 };
  }

  if (role === Role.STUDENT) {
    if (liveClass.status !== LiveClassStatus.LIVE) {
      return {
        ok: false as const,
        error: "This class has not started yet. Check back when the session goes live.",
        status: 403,
      };
    }

    const student = await prisma.student.findFirst({
      where: { userId },
      include: { user: { select: { fullName: true } } },
    });
    if (!student) {
      return { ok: false as const, error: "Unauthorized.", status: 401 };
    }

    if (liveClass.courseId) {
      const enrolled = await prisma.courseStudent.findFirst({
        where: { studentId: student.id, courseId: liveClass.courseId },
      });
      if (!enrolled) {
        return { ok: false as const, error: "You are not enrolled in this course.", status: 403 };
      }
    } else if (!audienceAllowsRole(liveClass.audience, Role.STUDENT)) {
      return { ok: false as const, error: "This session is not open to students.", status: 403 };
    }

    const joinWindow = await canStudentJoinLiveClass(liveClass.id, student.id, liveClass.actualStart);
    if (!joinWindow.ok) {
      return { ok: false as const, error: joinWindow.error, status: joinWindow.status };
    }

    return {
      ok: true as const,
      liveClass,
      student,
      isLecturer: false,
      isModerator: false,
      displayName: student.user.fullName,
    };
  }

  return { ok: false as const, error: "Unauthorized.", status: 401 };
}

export async function assertLiveClassParticipant(
  liveClassId: string,
  userId: string,
  role: Role,
  options?: { sessionAs?: LiveClassSessionAs },
) {
  const access = await getLiveClassAccess(liveClassId, userId, role, options);
  if (!access.ok) {
    throw new Error(access.error);
  }
  if (role === Role.ADMIN) {
    return access;
  }
  if (role === Role.STUDENT && access.liveClass.status !== LiveClassStatus.LIVE) {
    throw new Error("This class is not live.");
  }
  return access;
}

export function buildRoomName(courseCode: string | null | undefined, classId: string, audience?: LiveClassAudience): string {
  const prefix = (courseCode || (audience === LiveClassAudience.LECTURERS ? "lecturers" : audience === LiveClassAudience.STUDENTS ? "students" : "general"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `transit-${prefix}-${classId.slice(0, 8)}`;
}

export async function createLiveClassAsAdmin(params: {
  title: string;
  description?: string;
  audience?: LiveClassAudience;
  startTime: Date;
  endTime?: Date;
}) {
  const audience = params.audience ?? LiveClassAudience.GENERAL;

  const liveClass = await prisma.liveClass.create({
    data: {
      title: params.title.trim(),
      description: params.description?.trim() || null,
      audience,
      startTime: params.startTime,
      endTime: params.endTime ?? null,
      status: LiveClassStatus.SCHEDULED,
      roomName: `pending-${Date.now()}`,
    },
  });

  const roomName = buildRoomName(null, liveClass.id, audience);
  return prisma.liveClass.update({
    where: { id: liveClass.id },
    data: { roomName },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { fullName: true } } } },
    },
  });
}

export async function startLiveClassAsAdmin(liveClassId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass) {
    throw new Error("Live class not found.");
  }

  if (liveClass.status === LiveClassStatus.ENDED || liveClass.status === LiveClassStatus.CANCELLED) {
    throw new Error("This class cannot be started.");
  }

  if (liveClass.status === LiveClassStatus.LIVE) {
    return liveClass;
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      status: LiveClassStatus.LIVE,
      actualStart: liveClass.actualStart ?? new Date(),
    },
  });
}

export async function endLiveClassAsAdmin(liveClassId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass) {
    throw new Error("Live class not found.");
  }

  const ended = await prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      status: LiveClassStatus.ENDED,
      actualEnd: new Date(),
    },
  });
  await finalizeLiveClassAttendance(liveClassId);
  return ended;
}

export async function updateLiveClassAsAdmin(
  liveClassId: string,
  params: {
    title?: string;
    description?: string | null;
    audience?: LiveClassAudience;
    startTime?: Date;
    endTime?: Date | null;
  },
) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass) {
    throw new Error("Live class not found.");
  }

  if (liveClass.status !== LiveClassStatus.SCHEDULED) {
    throw new Error("Only scheduled classes can be edited.");
  }

  const nextStart = params.startTime ?? liveClass.startTime;
  const nextEnd = params.endTime !== undefined ? params.endTime : liveClass.endTime;
  if (nextStart && nextEnd && nextEnd <= nextStart) {
    throw new Error("End time must be after start time.");
  }

  const nextAudience = params.audience ?? liveClass.audience;
  let roomName: string | undefined;
  if (!liveClass.courseId && nextAudience !== liveClass.audience) {
    roomName = buildRoomName(null, liveClassId, nextAudience);
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      ...(params.title !== undefined ? { title: params.title.trim() } : {}),
      ...(params.description !== undefined ? { description: params.description?.trim() || null } : {}),
      ...(params.audience !== undefined ? { audience: params.audience } : {}),
      ...(params.startTime !== undefined ? { startTime: params.startTime } : {}),
      ...(params.endTime !== undefined ? { endTime: params.endTime } : {}),
      ...(roomName ? { roomName } : {}),
    },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { fullName: true } } } },
    },
  });
}

export async function cancelLiveClassAsAdmin(liveClassId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass) {
    throw new Error("Live class not found.");
  }

  if (liveClass.status !== LiveClassStatus.SCHEDULED) {
    throw new Error("Only scheduled classes can be cancelled.");
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: { status: LiveClassStatus.CANCELLED },
  });
}

export async function createLiveClass(params: {
  lecturerId: string;
  courseId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
}) {
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { courseCode: true, lecturerId: true },
  });

  if (!course || course.lecturerId !== params.lecturerId) {
    throw new Error("Course not found or not assigned to you.");
  }

  const liveClass = await prisma.liveClass.create({
    data: {
      courseId: params.courseId,
      lecturerId: params.lecturerId,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      startTime: params.startTime,
      endTime: params.endTime ?? null,
      status: LiveClassStatus.SCHEDULED,
      roomName: `pending-${Date.now()}`,
    },
  });

  const roomName = buildRoomName(course.courseCode, liveClass.id);
  return prisma.liveClass.update({
    where: { id: liveClass.id },
    data: { roomName },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { fullName: true } } } },
    },
  });
}

export async function startLiveClass(liveClassId: string, lecturerId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass || liveClass.lecturerId !== lecturerId) {
    throw new Error("Live class not found.");
  }

  if (liveClass.status === LiveClassStatus.ENDED || liveClass.status === LiveClassStatus.CANCELLED) {
    throw new Error("This class cannot be started.");
  }

  if (liveClass.status === LiveClassStatus.LIVE) {
    return liveClass;
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      status: LiveClassStatus.LIVE,
      actualStart: liveClass.actualStart ?? new Date(),
    },
  });
}

export async function updateLiveClass(
  liveClassId: string,
  lecturerId: string,
  params: {
    title?: string;
    description?: string | null;
    courseId?: string;
    startTime?: Date;
    endTime?: Date | null;
  },
) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass || liveClass.lecturerId !== lecturerId) {
    throw new Error("Live class not found.");
  }

  if (liveClass.status !== LiveClassStatus.SCHEDULED) {
    throw new Error("Only scheduled classes can be edited.");
  }

  const nextStart = params.startTime ?? liveClass.startTime;
  const nextEnd = params.endTime !== undefined ? params.endTime : liveClass.endTime;
  if (nextStart && nextEnd && nextEnd <= nextStart) {
    throw new Error("End time must be after start time.");
  }

  let roomName: string | undefined;
  if (params.courseId && params.courseId !== liveClass.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { lecturerId: true, courseCode: true },
    });
    if (!course || course.lecturerId !== lecturerId) {
      throw new Error("Course not found or not assigned to you.");
    }
    roomName = buildRoomName(course.courseCode, liveClassId);
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      ...(params.title !== undefined ? { title: params.title.trim() } : {}),
      ...(params.description !== undefined ? { description: params.description?.trim() || null } : {}),
      ...(params.courseId !== undefined ? { courseId: params.courseId } : {}),
      ...(params.startTime !== undefined ? { startTime: params.startTime } : {}),
      ...(params.endTime !== undefined ? { endTime: params.endTime } : {}),
      ...(roomName ? { roomName } : {}),
    },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
    },
  });
}

export async function cancelLiveClass(liveClassId: string, lecturerId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass || liveClass.lecturerId !== lecturerId) {
    throw new Error("Live class not found.");
  }

  if (liveClass.status !== LiveClassStatus.SCHEDULED) {
    throw new Error("Only scheduled classes can be cancelled.");
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: { status: LiveClassStatus.CANCELLED },
  });
}

export async function endLiveClass(liveClassId: string, lecturerId: string) {
  const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
  if (!liveClass || liveClass.lecturerId !== lecturerId) {
    throw new Error("Live class not found.");
  }

  const ended = await prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      status: LiveClassStatus.ENDED,
      actualEnd: new Date(),
    },
  });
  await finalizeLiveClassAttendance(liveClassId);
  return ended;
}

function resolveAttendanceStatus(attendancePercent: number, joinedLate: boolean): AttendanceStatus {
  if (attendancePercent >= ATTENDANCE_PRESENT_THRESHOLD) {
    return joinedLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
  }
  if (attendancePercent >= ATTENDANCE_PARTIAL_THRESHOLD) {
    return AttendanceStatus.PARTIAL;
  }
  return attendancePercent > 0 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT;
}

export async function logLiveClassJoin(params: {
  liveClassId: string;
  studentId: string;
  studentIdCode: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
}) {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: params.liveClassId },
    select: { actualStart: true },
  });
  const joinTime = new Date();
  const joinedLate = liveClass?.actualStart
    ? joinTime.getTime() - liveClass.actualStart.getTime() > LIVE_CLASS_LATE_JOIN_MINUTES * 60 * 1000
    : false;

  return prisma.liveClassAttendanceLog.upsert({
    where: {
      liveClassId_studentId: {
        liveClassId: params.liveClassId,
        studentId: params.studentId,
      },
    },
    create: {
      liveClassId: params.liveClassId,
      studentId: params.studentId,
      studentIdCode: params.studentIdCode,
      studentName: params.studentName,
      courseCode: params.courseCode,
      courseTitle: params.courseTitle,
      joinTime,
      status: joinedLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    },
    update: {
      joinTime,
      status: joinedLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    },
  });
}

export async function logLiveClassExit(liveClassId: string, studentId: string) {
  const [log, liveClass] = await Promise.all([
    prisma.liveClassAttendanceLog.findUnique({
      where: { liveClassId_studentId: { liveClassId, studentId } },
    }),
    prisma.liveClass.findUnique({
      where: { id: liveClassId },
      select: { actualStart: true, actualEnd: true, endTime: true },
    }),
  ]);
  if (!log || log.exitTime) return null;

  const exitTime = new Date();
  const durationSeconds = Math.max(0, Math.floor((exitTime.getTime() - log.joinTime.getTime()) / 1000));
  const classStart = liveClass?.actualStart ?? log.joinTime;
  const classEnd = liveClass?.actualEnd ?? liveClass?.endTime ?? exitTime;
  const totalClassSeconds = Math.max(60, Math.floor((classEnd.getTime() - classStart.getTime()) / 1000));
  const attendancePercent = Math.min(100, Math.round((durationSeconds / totalClassSeconds) * 100));
  const joinedLate =
    liveClass?.actualStart != null &&
    log.joinTime.getTime() - liveClass.actualStart.getTime() > LIVE_CLASS_LATE_JOIN_MINUTES * 60 * 1000;

  return prisma.liveClassAttendanceLog.update({
    where: { id: log.id },
    data: {
      exitTime,
      durationSeconds,
      attendancePercent,
      status: resolveAttendanceStatus(attendancePercent, joinedLate),
    },
  });
}

export async function finalizeLiveClassAttendance(liveClassId: string) {
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: { actualStart: true, actualEnd: true, endTime: true },
  });
  if (!liveClass?.actualStart) return;

  const classEnd = liveClass.actualEnd ?? liveClass.endTime ?? new Date();
  const totalClassSeconds = Math.max(60, Math.floor((classEnd.getTime() - liveClass.actualStart.getTime()) / 1000));

  const logs = await prisma.liveClassAttendanceLog.findMany({
    where: { liveClassId, exitTime: null },
  });

  await Promise.all(
    logs.map((log) => {
      const exitTime = classEnd;
      const durationSeconds = Math.max(0, Math.floor((exitTime.getTime() - log.joinTime.getTime()) / 1000));
      const attendancePercent = Math.min(100, Math.round((durationSeconds / totalClassSeconds) * 100));
      const joinedLate =
        log.joinTime.getTime() - liveClass.actualStart!.getTime() > LIVE_CLASS_LATE_JOIN_MINUTES * 60 * 1000;

      return prisma.liveClassAttendanceLog.update({
        where: { id: log.id },
        data: {
          exitTime,
          durationSeconds,
          attendancePercent,
          status: resolveAttendanceStatus(attendancePercent, joinedLate),
        },
      });
    }),
  );
}

export async function postLiveClassMessage(params: {
  liveClassId: string;
  userId: string;
  senderName: string;
  senderRole: Role;
  message: string;
}) {
  const text = params.message.trim();
  if (!text) throw new Error("Message cannot be empty.");

  return prisma.liveClassChatMessage.create({
    data: {
      liveClassId: params.liveClassId,
      userId: params.userId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      message: text,
    },
  });
}

export async function raiseHand(liveClassId: string, studentId: string, studentName: string) {
  return prisma.liveClassHandRaise.upsert({
    where: { liveClassId_studentId: { liveClassId, studentId } },
    create: { liveClassId, studentId, studentName, isActive: true },
    update: { isActive: true, createdAt: new Date() },
  });
}

export async function lowerHand(liveClassId: string, studentId: string) {
  return prisma.liveClassHandRaise.updateMany({
    where: { liveClassId, studentId, isActive: true },
    data: { isActive: false },
  });
}

export async function lowerAllHands(liveClassId: string) {
  return prisma.liveClassHandRaise.updateMany({
    where: { liveClassId, isActive: true },
    data: { isActive: false },
  });
}
