import { FeePaymentStatus, Prisma } from "@prisma/client";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

export const DEFAULT_CURRENCY = "SLE";

export function formatMoney(amount: Prisma.Decimal | number, _currency = DEFAULT_CURRENCY): string {
  const value = decimalToNumber(amount);
  const formatted = new Intl.NumberFormat("en-SL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} leones`;
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

export function shouldLockAccess(
  status: FeePaymentStatus,
  dueDate: Date | null | undefined,
  accessLocked: boolean,
): boolean {
  if (!accessLocked) return false;
  if (status === FeePaymentStatus.PAID) return false;
  if (!dueDate) return true;
  return new Date() > dueDate;
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
    select: { status: true, dueDate: true, accessLocked: true },
  });
  return accounts.some((account) => shouldLockAccess(account.status, account.dueDate, account.accessLocked));
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
        accessLocked: status === FeePaymentStatus.PAID ? false : account.accessLocked,
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

  return { payment, status, remaining };
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
    select: {
      totalAmount: true,
      amountPaid: true,
      status: true,
    },
  });

  let collected = 0;
  let outstanding = 0;
  const statusCounts = { PAID: 0, PARTIAL: 0, UNPAID: 0 };

  for (const account of accounts) {
    const total = decimalToNumber(account.totalAmount);
    const paid = decimalToNumber(account.amountPaid);
    collected += paid;
    outstanding += Math.max(0, total - paid);
    statusCounts[account.status] += 1;
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
  };
}
