import { normalizeAcademicYear } from "@/lib/academic-years";
import { resolveDepartmentProgramIds } from "@/lib/admitted-student";
import { prisma } from "@/lib/prisma";
import { isValidStudentId, normalizeStudentId } from "@/lib/student-id";
import type { ParsedAdmitRow } from "@/lib/parse-admitted-csv";

export type ImportRowResult = {
  row: number;
  studentId: string;
  status: "imported" | "skipped" | "error";
  message?: string;
};

export async function importAdmittedStudents(
  rows: ParsedAdmitRow[],
  options?: { skipDuplicates?: boolean },
): Promise<{
  imported: number;
  skipped: number;
  results: ImportRowResult[];
}> {
  const skipDuplicates = options?.skipDuplicates ?? true;
  const results: ImportRowResult[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const input = rows[i];
    const normalizedStudentId = normalizeStudentId(input.studentId);

    if (!normalizedStudentId || !isValidStudentId(normalizedStudentId)) {
      results.push({
        row: rowNum,
        studentId: input.studentId,
        status: "error",
        message: "Invalid student ID format. Use TCSL/001.",
      });
      continue;
    }

    if (!input.fullName.trim()) {
      results.push({
        row: rowNum,
        studentId: normalizedStudentId,
        status: "error",
        message: "Full name is required.",
      });
      continue;
    }

    const [existingStudent, existingAdmitted] = await Promise.all([
      prisma.student.findUnique({ where: { studentId: normalizedStudentId } }),
      prisma.admittedStudent.findUnique({ where: { studentId: normalizedStudentId } }),
    ]);

    if (existingStudent) {
      results.push({
        row: rowNum,
        studentId: normalizedStudentId,
        status: "skipped",
        message: "Student already has a registered account.",
      });
      skipped++;
      continue;
    }

    if (existingAdmitted) {
      if (skipDuplicates) {
        results.push({
          row: rowNum,
          studentId: normalizedStudentId,
          status: "skipped",
          message: "Already in admitted registry.",
        });
        skipped++;
        continue;
      }
      results.push({
        row: rowNum,
        studentId: normalizedStudentId,
        status: "error",
        message: "Student ID already in admitted registry.",
      });
      continue;
    }

    const deptProgram = await resolveDepartmentProgramIds(input.departmentName, input.programName);
    if ("error" in deptProgram) {
      results.push({
        row: rowNum,
        studentId: normalizedStudentId,
        status: "error",
        message: deptProgram.error,
      });
      continue;
    }

    await prisma.admittedStudent.create({
      data: {
        studentId: normalizedStudentId,
        fullName: input.fullName.trim(),
        departmentId: deptProgram.departmentId,
        programId: deptProgram.programId,
        level: normalizeAcademicYear(input.year),
        semester: input.semester?.trim() || null,
        admissionYear: input.admissionYear?.trim() || null,
      },
    });

    results.push({
      row: rowNum,
      studentId: normalizedStudentId,
      status: "imported",
    });
    imported++;
  }

  return { imported, skipped, results };
}
