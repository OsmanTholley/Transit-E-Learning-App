import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { decimalToNumber, ensureFeeInvoice, formatMoney } from "@/lib/finance-service";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ accountId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const student = await requireStudent();
  if (!student) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { accountId } = await context.params;
  const account = await prisma.studentFeeAccount.findFirst({
    where: { id: accountId, studentId: student.id },
    include: {
      feeStructure: true,
      payments: { orderBy: { paidAt: "asc" } },
      student: { include: { user: true, program: true, department: true } },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Billing account not found." }, { status: 404 });
  }

  const invoice = await ensureFeeInvoice(account.id);
  const total = decimalToNumber(account.totalAmount);
  const paid = decimalToNumber(account.amountPaid);
  const balance = Math.max(0, total - paid);
  const platform = process.env.PLATFORM_NAME?.trim() || "Transit E-Learning";
  const currency = account.feeStructure.currency;

  const paymentRows = account.payments
    .map(
      (payment) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${payment.paidAt.toLocaleDateString()}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${payment.receiptNumber}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(decimalToNumber(payment.amount), currency)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; color: #0f172a; margin: 40px; }
    h1 { margin-bottom: 4px; }
    .muted { color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; }
    .totals td { padding: 8px 0; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${platform}</h1>
  <p class="muted">Official fee statement</p>
  <p><strong>Invoice:</strong> ${invoice.invoiceNumber}<br />
     <strong>Student:</strong> ${account.student.user.fullName} (${account.student.studentId})<br />
     <strong>Program:</strong> ${account.student.program?.programName ?? "—"}<br />
     <strong>Department:</strong> ${account.student.department?.departmentName ?? "—"}</p>
  <h2>${account.feeStructure.title}</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Receipt</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${paymentRows || `<tr><td colspan="3" style="padding:8px;">No payments recorded yet.</td></tr>`}
    </tbody>
  </table>
  <table class="totals" style="max-width:320px;margin-left:auto;">
    <tr><td>Total tuition</td><td style="text-align:right;"><strong>${formatMoney(total, currency)}</strong></td></tr>
    <tr><td>Amount paid</td><td style="text-align:right;">${formatMoney(paid, currency)}</td></tr>
    <tr><td>Outstanding balance</td><td style="text-align:right;"><strong>${formatMoney(balance, currency)}</strong></td></tr>
  </table>
  <p class="muted" style="margin-top:32px;">Generated ${new Date().toLocaleString()}. Use your browser's Print → Save as PDF for expense claims.</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.html"`,
    },
  });
}
