import { NextResponse } from "next/server";
import { getStudentFeeLockDetails } from "@/lib/finance-service";

export const FEE_LOCK_MESSAGES = {
  live: "Access Restricted. Please complete the required payment to attend live sessions.",
  materials: "Access Restricted. Your payment requirement has not been met.",
  videos: "Access Restricted. Please complete your required payment to access course videos.",
  general: "Access Restricted. Please complete your required payment to regain access.",
} as const;

export type FeeLockContext = keyof typeof FEE_LOCK_MESSAGES;

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
