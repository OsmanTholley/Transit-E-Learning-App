import { AttendanceStatus, LiveClassStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const JITSI_DOMAIN = process.env.JITSI_DOMAIN?.trim() || "meet.jit.si";
export const LIVE_CLASS_LATE_JOIN_MINUTES = 10;
export const VIRTUAL_ROOM_MAX_PARTICIPANTS = 100;
export const ATTENDANCE_PRESENT_THRESHOLD = 75;
export const ATTENDANCE_PARTIAL_THRESHOLD = 40;

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
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    include: {
      course: { select: { courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { id: true, fullName: true } } } },
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
    if (lecturer && liveClass.lecturerId === lecturer.id) {
      return {
        ok: true as const,
        liveClass,
        lecturer,
        isLecturer: true,
        isModerator: true,
        displayName: lecturer.user.fullName,
      };
    }
    return { ok: false as const, error: "You are not the lecturer for this class.", status: 403 };
  }

  if (role === Role.STUDENT) {
    if (liveClass.status !== LiveClassStatus.LIVE) {
      return {
        ok: false as const,
        error: "This class has not started yet. Check back when the lecturer starts the session.",
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

    const enrolled = await prisma.courseStudent.findFirst({
      where: { studentId: student.id, courseId: liveClass.courseId ?? "" },
    });
    if (!enrolled) {
      return { ok: false as const, error: "You are not enrolled in this course.", status: 403 };
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

export function buildRoomName(courseCode: string | null | undefined, classId: string): string {
  const prefix = (courseCode || "transit")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `transit-${prefix}-${classId.slice(0, 8)}`;
}

export async function createLiveClassAsAdmin(params: {
  courseId: string;
  lecturerId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
}) {
  const [course, lecturer] = await Promise.all([
    prisma.course.findUnique({
      where: { id: params.courseId },
      select: { courseCode: true },
    }),
    prisma.lecturer.findUnique({ where: { id: params.lecturerId } }),
  ]);

  if (!course) {
    throw new Error("Course not found.");
  }
  if (!lecturer) {
    throw new Error("Lecturer not found.");
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
    courseId?: string;
    lecturerId?: string;
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

  if (params.lecturerId) {
    const lecturer = await prisma.lecturer.findUnique({ where: { id: params.lecturerId } });
    if (!lecturer) {
      throw new Error("Lecturer not found.");
    }
  }

  const nextStart = params.startTime ?? liveClass.startTime;
  const nextEnd = params.endTime !== undefined ? params.endTime : liveClass.endTime;
  if (nextStart && nextEnd && nextEnd <= nextStart) {
    throw new Error("End time must be after start time.");
  }

  const nextCourseId = params.courseId ?? liveClass.courseId;
  let roomName: string | undefined;
  if (nextCourseId && nextCourseId !== liveClass.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: nextCourseId },
      select: { courseCode: true },
    });
    if (!course) {
      throw new Error("Course not found.");
    }
    roomName = buildRoomName(course.courseCode, liveClassId);
  }

  return prisma.liveClass.update({
    where: { id: liveClassId },
    data: {
      ...(params.title !== undefined ? { title: params.title.trim() } : {}),
      ...(params.description !== undefined ? { description: params.description?.trim() || null } : {}),
      ...(params.courseId !== undefined ? { courseId: params.courseId } : {}),
      ...(params.lecturerId !== undefined ? { lecturerId: params.lecturerId } : {}),
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
