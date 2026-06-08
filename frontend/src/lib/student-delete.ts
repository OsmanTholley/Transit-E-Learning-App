import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { findStudentByParam } from "@/lib/student-update";

export async function deleteStudentAccount(id: string, actorId?: string | null) {
  const student = await findStudentByParam(id);
  if (!student) {
    return { error: "Student not found." as const };
  }

  const studentDbId = student.id;
  const studentCode = student.studentId;
  const fullName = student.user.fullName;

  await prisma.$transaction(async (tx) => {
    const discussions = await tx.discussion.findMany({
      where: { studentId: studentDbId },
      select: { id: true },
    });
    const discussionIds = discussions.map((d) => d.id);

    if (discussionIds.length > 0) {
      await tx.comment.deleteMany({ where: { discussionId: { in: discussionIds } } });
      await tx.discussion.deleteMany({ where: { id: { in: discussionIds } } });
    }

    await tx.courseStudent.deleteMany({ where: { studentId: studentDbId } });
    await tx.quizAttempt.deleteMany({ where: { studentId: studentDbId } });
    await tx.submission.deleteMany({ where: { studentId: studentDbId } });
    await tx.attendance.deleteMany({ where: { studentId: studentDbId } });
    await tx.aiChatHistory.deleteMany({ where: { studentId: studentDbId } });
    await tx.admittedStudent.deleteMany({ where: { studentId: studentCode } });
    await tx.user.delete({ where: { id: student.userId } });
  });

  await logActivity({
    actorId: actorId ?? null,
    action: "student.deleted",
    entityType: "student",
    entityId: studentDbId,
    summary: `Deleted student ${fullName} (${studentCode})`,
  });

  return { message: `${fullName} (${studentCode}) has been removed.` as const };
}
