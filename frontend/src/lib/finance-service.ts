import { FeePaymentStatus, Prisma } from "@prisma/client";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export const DEFAULT_CURRENCY = "SLE";

export type PaymentComplianceStatus = "ELIGIBLE" | "REQUIREMENT_NOT_MET" | "ACCESS_RESTRICTED";

export type FeeAccountSnapshot = {
  totalAmount: Prisma.Decimal | number;
  amountPaid: Prisma.Decimal | number;
  dueDate: Date | null | undefined;
  accessLocked: boolean;
  requiredPaymentPercent?: number | null;
  restrictionOverridden?: boolean;
  temporaryAccessUntil?: Date | null;
  feeStructure?: { requiredPaymentPercent?: number | null } | null;
};

export function formatMoney(amount: Prisma.Decimal | number, _currency = DEFAULT_CURRENCY): string {
  const value = decimalToNumber(amount);
  const formatted = new Intl.NumberFormat("en-SL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `Le${formatted}`;
}

export function computeFeeStatus(
  totalAmount: Prisma.Decimal | number,
  amountPaid: Prisma.Decimal | number,
): FeePaymentStatus {
  const total = decimalToNumber(totalAmount);
  const paid = decimalToNumber(amountPaid);
  if (paid <= 0) return FeePaymentStatus.UNPAID;
  if (paid >= total) return FeePaymentStatus.PAID;
  return FeePaymentStatus.PARTIAL;
}

export function resolveRequiredPaymentPercent(account: FeeAccountSnapshot): number {
  const percent = account.requiredPaymentPercent ?? account.feeStructure?.requiredPaymentPercent ?? 100;
  return Math.min(100, Math.max(0, percent));
}

export function computeRequiredAmount(
  totalAmount: Prisma.Decimal | number,
  requiredPercent: number,
): number {
  const total = decimalToNumber(totalAmount);
  return Math.round(((total * requiredPercent) / 100) * 100) / 100;
}

export function computePaymentCompliance(account: FeeAccountSnapshot): {
  requiredPercent: number;
  requiredAmount: number;
  amountPaid: number;
  totalAmount: number;
  outstandingBalance: number;
  status: PaymentComplianceStatus;
  isRestricted: boolean;
  pastDue: boolean;
} {
  const totalAmount = decimalToNumber(account.totalAmount);
  const amountPaid = decimalToNumber(account.amountPaid);
  const requiredPercent = resolveRequiredPaymentPercent(account);
  const requiredAmount = computeRequiredAmount(totalAmount, requiredPercent);
  const outstandingBalance = Math.max(0, totalAmount - amountPaid);
  const pastDue = account.dueDate ? new Date() > account.dueDate : false;

  if (account.restrictionOverridden) {
    return {
      requiredPercent,
      requiredAmount,
      amountPaid,
      totalAmount,
      outstandingBalance,
      status: "ELIGIBLE",
      isRestricted: false,
      pastDue,
    };
  }

  if (account.temporaryAccessUntil && new Date() < account.temporaryAccessUntil) {
    return {
      requiredPercent,
      requiredAmount,
      amountPaid,
      totalAmount,
      outstandingBalance,
      status: "ELIGIBLE",
      isRestricted: false,
      pastDue,
    };
  }

  if (amountPaid >= requiredAmount - 0.001) {
    return {
      requiredPercent,
      requiredAmount,
      amountPaid,
      totalAmount,
      outstandingBalance,
      status: "ELIGIBLE",
      isRestricted: false,
      pastDue,
    };
  }

  if (account.accessLocked && pastDue) {
    return {
      requiredPercent,
      requiredAmount,
      amountPaid,
      totalAmount,
      outstandingBalance,
      status: "ACCESS_RESTRICTED",
      isRestricted: true,
      pastDue,
    };
  }

  return {
    requiredPercent,
    requiredAmount,
    amountPaid,
    totalAmount,
    outstandingBalance,
    status: "REQUIREMENT_NOT_MET",
    isRestricted: false,
    pastDue,
  };
}

export function shouldLockAccess(account: FeeAccountSnapshot): boolean {
  return computePaymentCompliance(account).isRestricted;
}

function receiptNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCT-${stamp}-${rand}`;
}

function invoiceNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `INV-${stamp}`;
}

export async function studentHasLockedFees(studentId: string): Promise<boolean> {
  const accounts = await prisma.studentFeeAccount.findMany({
    where: { studentId, accessLocked: true },
    include: { feeStructure: { select: { requiredPaymentPercent: true } } },
  });
  return accounts.some((account) => shouldLockAccess(account));
}

export async function getStudentFeeLockDetails(studentId: string) {
  const accounts = await prisma.studentFeeAccount.findMany({
    where: { studentId, accessLocked: true },
    include: {
      feeStructure: { select: { title: true, currency: true, requiredPaymentPercent: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const restricted = accounts
    .map((account) => ({
      account,
      compliance: computePaymentCompliance(account),
    }))
    .filter(({ compliance }) => compliance.isRestricted);

  if (restricted.length === 0) return null;

  const primary = restricted[0];
  return {
    feeTitle: primary.account.feeStructure.title,
    currency: primary.account.feeStructure.currency,
    ...primary.compliance,
    dueDate: primary.account.dueDate?.toISOString() ?? null,
  };
}

export async function recordPayment(params: {
  studentFeeAccountId: string;
  amount: number;
  method?: string;
  reference?: string;
  notes?: string;
  recordedById?: string;
  paidAt?: Date;
}) {
  if (params.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const account = await prisma.studentFeeAccount.findUnique({
    where: { id: params.studentFeeAccountId },
    include: {
      student: { include: { user: true } },
      feeStructure: true,
    },
  });

  if (!account) {
    throw new Error("Fee account not found.");
  }

  const total = decimalToNumber(account.totalAmount);
  const currentPaid = decimalToNumber(account.amountPaid);
  const newPaid = currentPaid + params.amount;

  if (newPaid > total + 0.001) {
    throw new Error("Payment exceeds outstanding balance.");
  }

  const status = computeFeeStatus(total, newPaid);
  const receipt = receiptNumber();
  const paidAt = params.paidAt ?? new Date();
  const compliance = computePaymentCompliance({
    ...account,
    amountPaid: newPaid,
  });

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        studentFeeAccountId: account.id,
        amount: params.amount,
        method: params.method?.trim() || null,
        reference: params.reference?.trim() || null,
        notes: params.notes?.trim() || null,
        recordedById: params.recordedById ?? null,
        receiptNumber: receipt,
        paidAt,
      },
    });

    await tx.studentFeeAccount.update({
      where: { id: account.id },
      data: {
        amountPaid: newPaid,
        status,
        accessLocked: compliance.isRestricted ? account.accessLocked : false,
      },
    });

    return created;
  });

  const remaining = Math.max(0, total - newPaid);
  const studentEmail = account.student.user.email;
  if (studentEmail) {
    await sendPaymentReceiptEmail({
      to: studentEmail,
      fullName: account.student.user.fullName,
      amountPaid: formatMoney(params.amount, account.feeStructure.currency),
      remainingBalance: formatMoney(remaining, account.feeStructure.currency),
      receiptNumber: receipt,
      feeTitle: account.feeStructure.title,
    });
  }

  await logActivity({
    actorId: params.recordedById ?? null,
    action: "PAYMENT_RECEIVED",
    entityType: "student_fee_account",
    entityId: account.id,
    summary: `Payment of ${formatMoney(params.amount)} recorded for ${account.student.user.fullName}.`,
    metadata: {
      amount: params.amount,
      previousPaid: currentPaid,
      newPaid,
      receiptNumber: receipt,
    },
  });

  if (!compliance.isRestricted && account.accessLocked) {
    await logActivity({
      actorId: params.recordedById ?? null,
      action: "RESTRICTION_REMOVED",
      entityType: "student_fee_account",
      entityId: account.id,
      summary: `Academic access restored for ${account.student.user.fullName}.`,
      metadata: { amountPaid: newPaid, requiredAmount: compliance.requiredAmount },
    });
  }

  return { payment, status, remaining, compliance };
}

export async function ensureFeeInvoice(studentFeeAccountId: string) {
  const existing = await prisma.feeInvoice.findFirst({
    where: { studentFeeAccountId },
    orderBy: { issuedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.feeInvoice.create({
    data: {
      studentFeeAccountId,
      invoiceNumber: invoiceNumber(),
    },
  });
}

export async function getFinanceDashboardSummary() {
  const accounts = await prisma.studentFeeAccount.findMany({
    include: { feeStructure: { select: { requiredPaymentPercent: true } } },
  });

  let collected = 0;
  let outstanding = 0;
  const statusCounts = { PAID: 0, PARTIAL: 0, UNPAID: 0 };
  let eligible = 0;
  let restricted = 0;
  let nearDue = 0;
  let overdue = 0;
  const now = new Date();
  const nearDueCutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  for (const account of accounts) {
    const total = decimalToNumber(account.totalAmount);
    const paid = decimalToNumber(account.amountPaid);
    collected += paid;
    outstanding += Math.max(0, total - paid);
    statusCounts[account.status] += 1;

    const compliance = computePaymentCompliance(account);
    if (compliance.isRestricted) restricted += 1;
    else if (compliance.status === "ELIGIBLE") eligible += 1;

    if (account.dueDate) {
      if (compliance.pastDue && compliance.status !== "ELIGIBLE") overdue += 1;
      else if (account.dueDate <= nearDueCutoff && account.dueDate >= now && compliance.status !== "ELIGIBLE") {
        nearDue += 1;
      }
    }
  }

  const totalBilled = collected + outstanding;
  const collectionRatio = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;

  return {
    collected,
    outstanding,
    totalBilled,
    collectionRatio,
    statusCounts,
    studentCount: accounts.length,
    eligibleStudents: eligible,
    restrictedStudents: restricted,
    nearDueStudents: nearDue,
    overdueStudents: overdue,
  };
}

export async function notifyFeeAssignment(params: {
  studentUserId: string;
  feeTitle: string;
  requiredPercent: number;
  dueDate: Date | null;
}) {
  const dueLabel = params.dueDate
    ? params.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "the due date";
  await prisma.notification.create({
    data: {
      userId: params.studentUserId,
      title: "Tuition payment requirement assigned",
      message: `Your tuition payment requirement has been assigned. You are required to pay ${params.requiredPercent}% of your fees before ${dueLabel}.`,
      targetUrl: "/student/billing",
    },
  });
}

export async function processDueFeeReminders() {
  const accounts = await prisma.studentFeeAccount.findMany({
    where: { accessLocked: true },
    include: {
      student: { include: { user: { select: { id: true, fullName: true } } } },
      feeStructure: { select: { title: true, requiredPaymentPercent: true } },
    },
  });

  const now = new Date();
  let sent = 0;

  for (const account of accounts) {
    if (!account.dueDate) continue;
    const compliance = computePaymentCompliance(account);
    if (compliance.status === "ELIGIBLE") continue;

    const daysUntilDue = Math.ceil((account.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const reminderDays = [30, 14, 7, 3, 1];
    const isOverdue = compliance.pastDue;
    const shouldRemindBefore = reminderDays.includes(daysUntilDue);
    const shouldRemindOverdue =
      isOverdue &&
      (!account.lastReminderAt ||
        now.getTime() - account.lastReminderAt.getTime() >= 24 * 60 * 60 * 1000);

    if (!shouldRemindBefore && !shouldRemindOverdue) continue;

    const message = isOverdue
      ? "Your tuition payment requirement is overdue. Academic access restrictions are currently active."
      : `Reminder: you must pay ${compliance.requiredPercent}% of your fees (${formatMoney(compliance.requiredAmount)}) by ${account.dueDate.toLocaleDateString("en-GB")}.`;

    await prisma.notification.create({
      data: {
        userId: account.student.user.id,
        title: isOverdue ? "Payment overdue" : "Payment reminder",
        message,
        targetUrl: "/student/billing",
      },
    });

    await prisma.studentFeeAccount.update({
      where: { id: account.id },
      data: { lastReminderAt: now },
    });
    sent += 1;
  }

  return sent;
}
