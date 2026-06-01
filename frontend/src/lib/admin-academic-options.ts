import { prisma } from "@/lib/prisma";
import { isSeedDepartmentName } from "@/lib/seed-departments";

export type DepartmentOption = { id: string; name: string };
export type ProgramOption = { id: string; name: string; departmentId: string | null };
export type LecturerOption = { id: string; name: string };

export async function getAdminCreatedDepartments(): Promise<DepartmentOption[]> {
  const departments = await prisma.department.findMany({
    orderBy: { departmentName: "asc" },
    select: { id: true, departmentName: true },
  });

  return departments
    .filter((d) => !isSeedDepartmentName(d.departmentName))
    .map((d) => ({ id: d.id, name: d.departmentName }));
}

export async function getProgramsForDepartments(departmentIds: string[]): Promise<ProgramOption[]> {
  if (!departmentIds.length) return [];

  const programs = await prisma.program.findMany({
    where: { departmentId: { in: departmentIds } },
    orderBy: { programName: "asc" },
    select: { id: true, programName: true, departmentId: true },
  });

  return programs.map((p) => ({
    id: p.id,
    name: p.programName,
    departmentId: p.departmentId,
  }));
}

export async function getActiveLecturerOptions(): Promise<LecturerOption[]> {
  const lecturers = await prisma.lecturer.findMany({
    where: { user: { isActive: true } },
    orderBy: { user: { fullName: "asc" } },
    include: { user: { select: { fullName: true } } },
  });

  return lecturers.map((l) => ({ id: l.id, name: l.user.fullName }));
}
