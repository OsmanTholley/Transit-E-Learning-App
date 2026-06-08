import bcrypt from "bcryptjs";
import { normalizeAcademicYear } from "@/lib/academic-years";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { mapStudentToRecord } from "@/lib/student-mapper";
import { isValidStudentId, normalizeStudentId, STUDENT_ID_FORMAT_HINT } from "@/lib/student-id";
import { syncEnrollmentsForStudents } from "@/lib/course-enrollment";
import { validateProgramAssignment } from "@/lib/student-program-assignment";

export type UpdateStudentBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  departmentId?: string | null;
  programId?: string | null;
  level?: string | null;
  gender?: string | null;
  admissionYear?: string | null;
  isActive?: boolean;
  actorId?: string | null;
};

export async function findStudentByParam(id: string) {
  return prisma.student.findFirst({
    where: { OR: [{ id }, { studentId: id }] },
    include: {
      user: true,
      department: true,
      program: true,
    },
  });
}

export async function updateStudentAccount(id: string, body: UpdateStudentBody) {
  const student = await findStudentByParam(id);
  if (!student) {
    return { error: "Student not found." as const };
  }

  const userData: { fullName?: string; email?: string; phone?: string | null; isActive?: boolean } = {};
  const studentData: {
    departmentId?: string | null;
    programId?: string | null;
    level?: string | null;
    gender?: string | null;
    admissionYear?: string | null;
  } = {};

  if (typeof body.isActive === "boolean") {
    userData.isActive = body.isActive;
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
      where: { email, NOT: { id: student.userId } },
    });
    if (existing) return { error: "Email is already in use." as const };
    userData.email = email;
  }

  if (body.phone !== undefined) {
    userData.phone = body.phone.trim() || null;
  }

  let newStudentId: string | null = null;

  if (body.studentId !== undefined) {
    const normalizedStudentId = normalizeStudentId(body.studentId);
    if (!isValidStudentId(normalizedStudentId)) {
      return { error: `Student ID must use the format ${STUDENT_ID_FORMAT_HINT}.` as const };
    }

    if (normalizedStudentId !== student.studentId) {
      const [existingStudent, existingAdmitted] = await Promise.all([
        prisma.student.findUnique({ where: { studentId: normalizedStudentId } }),
        prisma.admittedStudent.findUnique({ where: { studentId: normalizedStudentId } }),
      ]);

      if (existingStudent && existingStudent.id !== student.id) {
        return { error: "Student ID is already assigned to another student." as const };
      }

      if (
        existingAdmitted &&
        existingAdmitted.registeredAt &&
        existingAdmitted.studentId !== student.studentId
      ) {
        const otherAccount = await prisma.student.findUnique({
          where: { studentId: existingAdmitted.studentId },
        });
        if (otherAccount && otherAccount.id !== student.id) {
          return { error: "Student ID is already registered in the admitted database." as const };
        }
      }

      newStudentId = normalizedStudentId;
    }
  }

  const hasProgramAssignment =
    Boolean(body.departmentId) &&
    Boolean(body.programId) &&
    Boolean(body.level?.trim());

  if (hasProgramAssignment) {
    const validated = await validateProgramAssignment({
      departmentId: body.departmentId!,
      programId: body.programId!,
      level: body.level!,
      gender: body.gender,
      admissionYear: body.admissionYear,
    });
    if ("error" in validated) return validated;
    studentData.departmentId = validated.data.departmentId;
    studentData.programId = validated.data.programId;
    studentData.level = validated.data.level;
    studentData.gender = validated.data.gender;
    studentData.admissionYear = validated.data.admissionYear;
  } else {
    if (body.level !== undefined) studentData.level = normalizeAcademicYear(body.level);
    if (body.gender !== undefined) studentData.gender = body.gender?.trim() || null;
    if (body.admissionYear !== undefined) studentData.admissionYear = body.admissionYear?.trim() || null;
  }

  if (
    Object.keys(userData).length === 0 &&
    Object.keys(studentData).length === 0 &&
    !newStudentId
  ) {
    return { error: "No changes to save." as const };
  }

  const previousStudentId = student.studentId;

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: student.userId },
        data: userData,
      });
    }

    const studentPatch: typeof studentData & { studentId?: string } = { ...studentData };
    if (newStudentId) {
      studentPatch.studentId = newStudentId;
    }

    if (Object.keys(studentPatch).length > 0) {
      await tx.student.update({
        where: { id: student.id },
        data: studentPatch,
      });

      await tx.admittedStudent.updateMany({
        where: { studentId: previousStudentId },
        data: {
          ...(newStudentId ? { studentId: newStudentId } : {}),
          ...studentData,
        },
      });

      if (newStudentId) {
        await tx.liveClassAttendanceLog.updateMany({
          where: { studentId: student.id },
          data: { studentIdCode: newStudentId },
        });
      }
    }

    return tx.student.findUniqueOrThrow({
      where: { id: student.id },
      include: { user: true, department: true, program: true },
    });
  });

  if (hasProgramAssignment || body.departmentId !== undefined || body.programId !== undefined) {
    await syncEnrollmentsForStudents([student.id]);
  }

  if (newStudentId) {
    await logActivity({
      actorId: body.actorId ?? null,
      action: "student.id_updated",
      entityType: "student",
      entityId: student.id,
      summary: `Student ID changed from ${previousStudentId} to ${newStudentId}`,
      metadata: { previousStudentId, newStudentId },
    });
  } else if (Object.keys(userData).length > 0 || Object.keys(studentData).length > 0) {
    await logActivity({
      actorId: body.actorId ?? null,
      action: "student.updated",
      entityType: "student",
      entityId: student.id,
      summary: `Updated profile for ${updated.user.fullName} (${updated.studentId})`,
    });
  }

  return { student: mapStudentToRecord(updated) };
}

export async function resetStudentPassword(id: string, password: string) {
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." as const };
  }

  const student = await findStudentByParam(id);
  if (!student) {
    return { error: "Student not found." as const };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: student.userId },
    data: { password: passwordHash },
  });

  return { message: "Password reset successfully." as const };
}
