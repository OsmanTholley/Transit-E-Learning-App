import { normalizeAcademicYear } from "@/lib/academic-years";
import { syncEnrollmentsForStudents } from "@/lib/course-enrollment";
import { prisma } from "@/lib/prisma";
import { mapStudentToRecord } from "@/lib/student-mapper";

export type AssignProgramInput = {
  departmentId: string;
  programId: string;
  level: string;
  gender?: string | null;
  admissionYear?: string | null;
};

type ValidatedAssignment = {
  departmentId: string;
  programId: string;
  level: string;
  gender: string | null;
  admissionYear: string | null;
};

export async function validateProgramAssignment(
  input: AssignProgramInput,
): Promise<{ error: string } | { data: ValidatedAssignment }> {
  const level = normalizeAcademicYear(input.level);

  if (!input.departmentId) {
    return { error: "Department is required." as const };
  }
  if (!input.programId) {
    return { error: "Program is required." as const };
  }
  if (!level) {
    return { error: "Year is required." as const };
  }

  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
  });
  if (!department) {
    return { error: "Department not found." as const };
  }

  const program = await prisma.program.findUnique({
    where: { id: input.programId },
  });
  if (!program) {
    return { error: "Program not found." as const };
  }
  if (program.departmentId && program.departmentId !== input.departmentId) {
    return { error: "Program does not belong to the selected department." as const };
  }

  return {
    data: {
      departmentId: input.departmentId,
      programId: input.programId,
      level,
      gender: input.gender?.trim() || null,
      admissionYear: input.admissionYear?.trim() || null,
    },
  };
}

export async function assignProgramToStudents(
  studentIds: string[],
  input: AssignProgramInput,
): Promise<{ error: string } | { students: ReturnType<typeof mapStudentToRecord>[]; count: number }> {
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { error: "Select at least one student." as const };
  }

  const validated = await validateProgramAssignment(input);
  if ("error" in validated) {
    return validated;
  }

  const { data } = validated;

  const existing = await prisma.student.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, studentId: true },
  });

  if (existing.length !== uniqueIds.length) {
    return { error: "One or more selected students were not found." as const };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const student of existing) {
      const row = await tx.student.update({
        where: { id: student.id },
        data,
        include: { user: true, department: true, program: true },
      });

      await tx.admittedStudent.updateMany({
        where: { studentId: student.studentId },
        data,
      });

      results.push(row);
    }
    return results;
  });

  await syncEnrollmentsForStudents(updated.map((s) => s.id));

  return {
    students: updated.map(mapStudentToRecord),
    count: updated.length,
  };
}
