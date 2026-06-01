import bcrypt from "bcryptjs";
import { normalizeAcademicYear } from "@/lib/academic-years";
import { prisma } from "@/lib/prisma";
import { mapStudentToRecord } from "@/lib/student-mapper";
import { validateProgramAssignment } from "@/lib/student-program-assignment";

export type UpdateStudentBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  departmentId?: string | null;
  programId?: string | null;
  level?: string | null;
  semester?: string | null;
  admissionYear?: string | null;
  isActive?: boolean;
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
    semester?: string | null;
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

  const hasProgramAssignment =
    Boolean(body.departmentId) &&
    Boolean(body.programId) &&
    Boolean(body.level?.trim()) &&
    Boolean(body.semester?.trim());

  if (hasProgramAssignment) {
    const validated = await validateProgramAssignment({
      departmentId: body.departmentId!,
      programId: body.programId!,
      level: body.level!,
      semester: body.semester!,
      admissionYear: body.admissionYear,
    });
    if ("error" in validated) return validated;
    studentData.departmentId = validated.data.departmentId;
    studentData.programId = validated.data.programId;
    studentData.level = validated.data.level;
    studentData.semester = validated.data.semester;
    studentData.admissionYear = validated.data.admissionYear;
  } else {
    if (body.level !== undefined) studentData.level = normalizeAcademicYear(body.level);
    if (body.semester !== undefined) studentData.semester = body.semester?.trim() || null;
    if (body.admissionYear !== undefined) studentData.admissionYear = body.admissionYear?.trim() || null;
  }

  if (Object.keys(userData).length === 0 && Object.keys(studentData).length === 0) {
    return { error: "No changes to save." as const };
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: student.userId },
        data: userData,
      });
    }

    if (Object.keys(studentData).length > 0) {
      await tx.student.update({
        where: { id: student.id },
        data: studentData,
      });

      await tx.admittedStudent.updateMany({
        where: { studentId: student.studentId },
        data: studentData,
      });
    }

    return tx.student.findUniqueOrThrow({
      where: { id: student.id },
      include: { user: true, department: true, program: true },
    });
  });

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
