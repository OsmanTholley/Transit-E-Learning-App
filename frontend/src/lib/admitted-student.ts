import { prisma } from "@/lib/prisma";
import { isValidStudentId, normalizeStudentId } from "@/lib/student-id";

export async function resolveDepartmentProgramIds(departmentName?: string, programName?: string) {
  let departmentId: string | null = null;
  let programId: string | null = null;

  if (departmentName?.trim()) {
    const department = await prisma.department.findFirst({
      where: { departmentName: departmentName.trim() },
    });
    if (!department) {
      return { error: "Department not found." as const };
    }
    departmentId = department.id;
  }

  if (programName?.trim()) {
    const program = await prisma.program.findFirst({
      where: {
        programName: programName.trim(),
        ...(departmentId ? { departmentId } : {}),
      },
    });
    if (!program) {
      return { error: "Program not found for this department." as const };
    }
    programId = program.id;
  }

  return { departmentId, programId };
}

export async function findAdmittedStudentForRegistration(studentIdInput: string) {
  const normalizedStudentId = normalizeStudentId(studentIdInput);

  if (!isValidStudentId(normalizedStudentId)) {
    return { error: "Student ID must use the format TCSL/001." as const };
  }

  const existingAccount = await prisma.student.findUnique({
    where: { studentId: normalizedStudentId },
  });
  if (existingAccount) {
    return { error: "This student ID already has an active account. Please sign in instead." as const };
  }

  const admitted = await prisma.admittedStudent.findUnique({
    where: { studentId: normalizedStudentId },
    include: { department: true, program: true },
  });

  if (!admitted) {
    return {
      error:
        "Student ID not found in the admitted students database. Contact the administration office.",
    } as const;
  }

  if (admitted.registeredAt) {
    return { error: "This student ID has already completed registration. Please sign in." as const };
  }

  return { admitted, normalizedStudentId };
}
