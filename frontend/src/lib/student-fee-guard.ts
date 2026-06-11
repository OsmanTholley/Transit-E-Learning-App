import { NextResponse } from "next/server";
import { getStudentFeeLockDetails } from "@/lib/finance-service";
import { prisma } from "@/lib/prisma";
import {
  FEE_LOCK_MESSAGES,
  type FeeLockContext,
  type FeeLockPayload,
} from "./student-fee-guard-shared";

export * from "./student-fee-guard-shared";

export async function getStudentFeeEligibility(studentId: string) {
  const lock = await getStudentFeeLockDetails(studentId);
  return {
    isRestricted: Boolean(lock),
    lock: lock
      ? ({
          feeTitle: lock.feeTitle,
          requiredPercent: lock.requiredPercent,
          requiredAmount: lock.requiredAmount,
          amountPaid: lock.amountPaid,
          outstandingBalance: lock.outstandingBalance,
          dueDate: lock.dueDate,
          status: lock.status,
        } satisfies FeeLockPayload)
      : null,
  };
}

export async function buildFeeLockResponse(studentId: string, context: FeeLockContext) {
  const lock = await getStudentFeeLockDetails(studentId);
  if (!lock) return null;

  return NextResponse.json(
    {
      error: FEE_LOCK_MESSAGES[context],
      code: "FEE_LOCKED",
      lock: {
        feeTitle: lock.feeTitle,
        requiredPercent: lock.requiredPercent,
        requiredAmount: lock.requiredAmount,
        amountPaid: lock.amountPaid,
        outstandingBalance: lock.outstandingBalance,
        dueDate: lock.dueDate,
        status: lock.status,
      },
    },
    { status: 403 },
  );
}

export async function assertStudentFeeAccess(studentId: string, context: FeeLockContext) {
  const response = await buildFeeLockResponse(studentId, context);
  if (response) throw response;
}

/** Guard helper for student API route handlers. */
export async function guardStudentFeeAccess(
  studentId: string,
  context: FeeLockContext,
): Promise<NextResponse | null> {
  return buildFeeLockResponse(studentId, context);
}

/** Fee guard for live-class routes keyed by auth user id (students only). */
export async function guardStudentUserFeeAccess(
  userId: string,
  context: FeeLockContext,
): Promise<NextResponse | null> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) return null;
  return buildFeeLockResponse(student.id, context);
}
