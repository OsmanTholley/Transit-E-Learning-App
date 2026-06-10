import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { decimalToNumber, ensureFeeInvoice, formatMoney } from "@/lib/finance-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const student = await requireStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const accounts = await prisma.studentFeeAccount.findMany({
      where: { studentId: student.id },
      include: {
        feeStructure: true,
        payments: { orderBy: { paidAt: "desc" } },
        invoices: { orderBy: { issuedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalDue = 0;
    let totalPaid = 0;

    const billing = await Promise.all(
      accounts.map(async (account) => {
        const total = decimalToNumber(account.totalAmount);
        const paid = decimalToNumber(account.amountPaid);
        const balance = Math.max(0, total - paid);
        totalDue += total;
        totalPaid += paid;

        const invoice = account.invoices[0] ?? (await ensureFeeInvoice(account.id));

        return {
          id: account.id,
          feeTitle: account.feeStructure.title,
          currency: account.feeStructure.currency,
          totalAmount: total,
          amountPaid: paid,
          balance,
          status: account.status,
          dueDate: account.dueDate?.toISOString() ?? account.feeStructure.dueDate?.toISOString() ?? null,
          accessLocked: account.accessLocked,
          invoiceNumber: invoice.invoiceNumber,
          transactions: account.payments.map((payment) => ({
            id: payment.id,
            amount: decimalToNumber(payment.amount),
            method: payment.method,
            reference: payment.reference,
            receiptNumber: payment.receiptNumber,
            paidAt: payment.paidAt.toISOString(),
          })),
        };
      }),
    );

    const outstanding = Math.max(0, totalDue - totalPaid);

    return NextResponse.json({
      summary: {
        totalDue,
        totalPaid,
        outstanding,
        totalDueLabel: formatMoney(totalDue),
        totalPaidLabel: formatMoney(totalPaid),
        outstandingLabel: formatMoney(outstanding),
      },
      accounts: billing,
    });
  } catch (error) {
    console.error("GET /api/student/billing:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load billing." }, { status: 500 });
  }
}
