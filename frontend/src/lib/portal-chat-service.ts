import { PortalChatKind, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function courseThreadKey(courseId: string) {
  return `course:${courseId}`;
}

export function directThreadKey(userIdA: string, userIdB: string) {
  const [a, b] = [userIdA, userIdB].sort();
  return `direct:${a}:${b}`;
}

export async function listStudentCourseRooms(studentUserId: string) {
  const student = await prisma.student.findFirst({
    where: { userId: studentUserId },
    include: {
      courseStudents: {
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              courseTitle: true,
              lecturer: { include: { user: { select: { id: true, fullName: true } } } },
            },
          },
        },
      },
    },
  });

  if (!student) return [];

  return student.courseStudents.map(({ course }) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    lecturerUserId: course.lecturer?.user.id ?? null,
    lecturerName: course.lecturer?.user.fullName ?? null,
    threadKey: courseThreadKey(course.id),
  }));
}

export async function listLecturerCourseRooms(lecturerUserId: string) {
  const lecturer = await prisma.lecturer.findFirst({
    where: { userId: lecturerUserId },
    include: {
      courses: {
        select: { id: true, courseCode: true, courseTitle: true },
      },
    },
  });

  if (!lecturer) return [];

  return lecturer.courses.map((course) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    threadKey: courseThreadKey(course.id),
  }));
}

export async function listStudentDirectContacts(studentUserId: string) {
  const student = await prisma.student.findFirst({
    where: { userId: studentUserId },
    include: {
      courseStudents: {
        include: {
          course: {
            select: {
              lecturer: {
                include: { user: { select: { id: true, fullName: true, role: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!student) return [];

  const map = new Map<string, { userId: string; fullName: string }>();
  for (const enrollment of student.courseStudents) {
    const lecturerUser = enrollment.course.lecturer?.user;
    if (lecturerUser) {
      map.set(lecturerUser.id, { userId: lecturerUser.id, fullName: lecturerUser.fullName });
    }
  }

  return Array.from(map.values()).map((contact) => ({
    ...contact,
    threadKey: directThreadKey(studentUserId, contact.userId),
  }));
}

export async function listLecturerDirectContacts(lecturerUserId: string) {
  const lecturer = await prisma.lecturer.findFirst({
    where: { userId: lecturerUserId },
    include: {
      courses: {
        include: {
          courseStudents: {
            include: {
              student: { include: { user: { select: { id: true, fullName: true } } } },
            },
          },
        },
      },
    },
  });

  if (!lecturer) return [];

  const map = new Map<string, { userId: string; fullName: string; studentId: string }>();
  for (const course of lecturer.courses) {
    for (const enrollment of course.courseStudents) {
      map.set(enrollment.student.user.id, {
        userId: enrollment.student.user.id,
        fullName: enrollment.student.user.fullName,
        studentId: enrollment.student.studentId,
      });
    }
  }

  return Array.from(map.values()).map((contact) => ({
    ...contact,
    threadKey: directThreadKey(lecturerUserId, contact.userId),
  }));
}

export async function assertCanAccessThread(params: {
  userId: string;
  role: Role;
  kind: PortalChatKind;
  courseId?: string | null;
  peerUserId?: string | null;
}) {
  if (params.kind === PortalChatKind.COURSE) {
    if (!params.courseId) throw new Error("Course is required.");

    if (params.role === Role.STUDENT) {
      const student = await prisma.student.findFirst({ where: { userId: params.userId } });
      if (!student) throw new Error("Unauthorized.");
      const enrolled = await prisma.courseStudent.findFirst({
        where: { studentId: student.id, courseId: params.courseId },
      });
      if (!enrolled) throw new Error("You are not enrolled in this course.");
      return;
    }

    if (params.role === Role.LECTURER) {
      const lecturer = await prisma.lecturer.findFirst({ where: { userId: params.userId } });
      if (!lecturer) throw new Error("Unauthorized.");
      const course = await prisma.course.findFirst({
        where: { id: params.courseId, lecturerId: lecturer.id },
      });
      if (!course) throw new Error("You are not assigned to this course.");
      return;
    }

    throw new Error("Unauthorized.");
  }

  if (!params.peerUserId) throw new Error("Recipient is required.");

  if (params.role === Role.STUDENT) {
    const contacts = await listStudentDirectContacts(params.userId);
    if (!contacts.some((contact) => contact.userId === params.peerUserId)) {
      throw new Error("You can only message lecturers from your courses.");
    }
    return;
  }

  if (params.role === Role.LECTURER) {
    const contacts = await listLecturerDirectContacts(params.userId);
    if (!contacts.some((contact) => contact.userId === params.peerUserId)) {
      throw new Error("You can only message students from your courses.");
    }
    return;
  }

  throw new Error("Unauthorized.");
}

export async function listThreadMessages(threadKey: string, limit = 80) {
  const messages = await prisma.portalChatMessage.findMany({
    where: { threadKey },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  return messages.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    senderId: message.senderId,
    senderName: message.sender.fullName,
    senderRole: message.sender.role,
  }));
}

export async function sendPortalChatMessage(params: {
  senderId: string;
  role: Role;
  kind: PortalChatKind;
  body: string;
  courseId?: string | null;
  peerUserId?: string | null;
}) {
  const text = params.body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  await assertCanAccessThread({
    userId: params.senderId,
    role: params.role,
    kind: params.kind,
    courseId: params.courseId,
    peerUserId: params.peerUserId,
  });

  const threadKey =
    params.kind === PortalChatKind.COURSE
      ? courseThreadKey(params.courseId!)
      : directThreadKey(params.senderId, params.peerUserId!);

  return prisma.portalChatMessage.create({
    data: {
      kind: params.kind,
      courseId: params.kind === PortalChatKind.COURSE ? params.courseId! : null,
      threadKey,
      senderId: params.senderId,
      body: text,
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });
}
