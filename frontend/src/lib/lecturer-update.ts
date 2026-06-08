import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { mapLecturerToRecord } from "@/lib/lecturer-mapper";

export type UpdateLecturerBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  specialization?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  actorId?: string | null;
};

const LECTURER_INCLUDE = {
  user: true,
  courses: {
    select: {
      courseCode: true,
      department: { select: { departmentName: true } },
    },
  },
} as const;

export async function findLecturerByParam(id: string) {
  return prisma.lecturer.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    include: LECTURER_INCLUDE,
  });
}

export async function updateLecturerAccount(id: string, body: UpdateLecturerBody) {
  const lecturer = await findLecturerByParam(id);
  if (!lecturer) {
    return { error: "Lecturer not found." as const };
  }

  const userData: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    isActive?: boolean;
  } = {};
  const lecturerData: { specialization?: string | null; isVerified?: boolean } = {};

  if (typeof body.isActive === "boolean") {
    userData.isActive = body.isActive;
  }

  if (typeof body.isVerified === "boolean") {
    lecturerData.isVerified = body.isVerified;
  }

  if (body.fullName !== undefined) {
    const name = body.fullName.trim();
    if (!name) return { error: "Full name is required." as const };
    userData.fullName = name;
  }

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (!email) return { error: "Email is required." as const };
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: lecturer.userId } },
    });
    if (existing) return { error: "Email is already in use." as const };
    userData.email = email;
  }

  if (body.phone !== undefined) {
    userData.phone = body.phone.trim() || null;
  }

  if (body.specialization !== undefined) {
    lecturerData.specialization = body.specialization?.trim() || null;
  }

  if (Object.keys(userData).length === 0 && Object.keys(lecturerData).length === 0) {
    return { error: "No changes to save." as const };
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: lecturer.userId },
        data: userData,
      });
    }

    if (Object.keys(lecturerData).length > 0) {
      await tx.lecturer.update({
        where: { id: lecturer.id },
        data: lecturerData,
      });
    }

    return tx.lecturer.findUniqueOrThrow({
      where: { id: lecturer.id },
      include: LECTURER_INCLUDE,
    });
  });

  await logActivity({
    actorId: body.actorId ?? null,
    action: "lecturer.updated",
    entityType: "lecturer",
    entityId: lecturer.id,
    summary: `Updated profile for ${updated.user.fullName}`,
  });

  return { lecturer: mapLecturerToRecord(updated) };
}

export async function resetLecturerPassword(id: string, password: string) {
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." as const };
  }

  const lecturer = await findLecturerByParam(id);
  if (!lecturer) {
    return { error: "Lecturer not found." as const };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: lecturer.userId },
    data: { password: passwordHash },
  });

  return { message: "Password reset successfully." as const };
}

export async function deleteLecturerAccount(id: string, actorId?: string | null) {
  const lecturer = await findLecturerByParam(id);
  if (!lecturer) {
    return { error: "Lecturer not found." as const };
  }

  const fullName = lecturer.user.fullName;

  await prisma.$transaction(async (tx) => {
    await tx.course.updateMany({ where: { lecturerId: lecturer.id }, data: { lecturerId: null } });
    await tx.lectureNote.updateMany({ where: { lecturerId: lecturer.id }, data: { lecturerId: null } });
    await tx.video.updateMany({ where: { lecturerId: lecturer.id }, data: { lecturerId: null } });
    await tx.quiz.updateMany({ where: { lecturerId: lecturer.id }, data: { lecturerId: null } });
    await tx.assignment.updateMany({ where: { lecturerId: lecturer.id }, data: { lecturerId: null } });
    await tx.liveClass.updateMany({ where: { lecturerId: lecturer.id }, data: { lecturerId: null } });
    await tx.user.delete({ where: { id: lecturer.userId } });
  });

  await logActivity({
    actorId: actorId ?? null,
    action: "lecturer.deleted",
    entityType: "lecturer",
    entityId: lecturer.id,
    summary: `Deleted lecturer ${fullName}`,
  });

  return { message: `${fullName} has been removed. Assigned courses were unassigned.` as const };
}
