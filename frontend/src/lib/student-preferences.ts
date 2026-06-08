import { prisma } from "@/lib/prisma";
import type { StudentPrefKey } from "@/lib/student-preference-keys";

export async function getStudentPreferences(studentId: string, keys?: StudentPrefKey[]) {
  const rows = await prisma.studentPreference.findMany({
    where: {
      studentId,
      ...(keys?.length ? { prefKey: { in: keys } } : {}),
    },
  });

  const preferences: Record<string, unknown> = {};
  for (const row of rows) {
    preferences[row.prefKey] = row.value;
  }
  return preferences;
}

export async function setStudentPreference(studentId: string, prefKey: string, value: unknown) {
  await prisma.studentPreference.upsert({
    where: {
      studentId_prefKey: { studentId, prefKey },
    },
    create: { studentId, prefKey, value: value as object },
    update: { value: value as object },
  });
}

export async function setStudentPreferences(
  studentId: string,
  entries: Record<string, unknown>
) {
  await prisma.$transaction(
    Object.entries(entries).map(([prefKey, value]) =>
      prisma.studentPreference.upsert({
        where: {
          studentId_prefKey: { studentId, prefKey },
        },
        create: { studentId, prefKey, value: value as object },
        update: { value: value as object },
      })
    )
  );
}
