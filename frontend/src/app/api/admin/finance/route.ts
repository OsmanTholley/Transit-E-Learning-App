import { NextRequest, NextResponse } from "next/server";
import { FeePaymentStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  decimalToNumber,
  DEFAULT_CURRENCY,
  formatMoney,
  getFinanceDashboardSummary,
} from "@/lib/finance-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status") as FeePaymentStatus | null;
    const courseId = request.nextUrl.searchParams.get("courseId");
    const programId = request.nextUrl.searchParams.get("programId");
    const intakeBatch = request.nextUrl.searchParams.get("intakeBatch");
    const exportCsv = request.nextUrl.searchParams.get("export") === "csv";

    const accounts = await prisma.studentFeeAccount.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(programId ? { student: { programId } } : {}),
        ...(intakeBatch ? { feeStructure: { intakeBatch } } : {}),
        ...(courseId
          ? { student: { courseStudents: { some: { courseId } } } }
          : {}),
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            program: { select: { programName: true } },
            department: { select: { departmentName: true } },
          },
        },
        feeStructure: true,
        payments: { orderBy: { paidAt: "desc" }, take: 3 },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    const summary = await getFinanceDashboardSummary();

    const feeStructures = await prisma.feeStructure.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { accounts: true } },
      },
    });

    const students = await prisma.student.findMany({
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const rows = accounts.map((account) => {
      const total = decimalToNumber(account.totalAmount);
      const paid = decimalToNumber(account.amountPaid);
      const balance = Math.max(0, total - paid);
      return {
        id: account.id,
        studentId: account.student.studentId,
        studentName: account.student.user.fullName,
        email: account.student.user.email,
        program: account.student.program?.programName ?? null,
        department: account.student.department?.departmentName ?? null,
        feeTitle: account.feeStructure.title,
        intakeBatch: account.feeStructure.intakeBatch,
        semester: account.feeStructure.semester,
        level: account.feeStructure.level,
        currency: account.feeStructure.currency,
        totalAmount: total,
        amountPaid: paid,
        balance,
        status: account.status,
        dueDate: account.dueDate?.toISOString() ?? account.feeStructure.dueDate?.toISOString() ?? null,
        accessLocked: account.accessLocked,
        recentPayments: account.payments.map((payment) => ({
          id: payment.id,
          amount: decimalToNumber(payment.amount),
          receiptNumber: payment.receiptNumber,
          paidAt: payment.paidAt.toISOString(),
        })),
      };
    });

    if (exportCsv) {
      const header = [
        "Student ID",
        "Name",
        "Fee",
        "Total",
        "Paid",
        "Balance",
        "Status",
        "Due Date",
      ];
      const lines = rows.map((row) =>
        [
          row.studentId,
          row.studentName,
          row.feeTitle,
          row.totalAmount,
          row.amountPaid,
          row.balance,
          row.status,
          row.dueDate ?? "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      );
      const csv = [header.join(","), ...lines].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="finance-ledger-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        ...summary,
        collectedLabel: formatMoney(summary.collected),
        outstandingLabel: formatMoney(summary.outstanding),
        totalBilledLabel: formatMoney(summary.totalBilled),
      },
      accounts: rows,
      feeStructures: feeStructures.map((fee) => ({
        id: fee.id,
        title: fee.title,
        amount: decimalToNumber(fee.amount),
        currency: fee.currency,
        amountLabel: formatMoney(fee.amount, fee.currency),
        dueDate: fee.dueDate?.toISOString() ?? null,
        intakeBatch: fee.intakeBatch,
        semester: fee.semester,
        level: fee.level,
        assignedCount: fee._count.accounts,
      })),
      students: students.map((student) => ({
        id: student.id,
        studentId: student.studentId,
        fullName: student.user.fullName,
        email: student.user.email,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/finance:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load finance data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "create_fee_structure") {
      const amount = Number(body.amount);
      if (!body.title?.trim() || !Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Valid title and amount are required." }, { status: 400 });
      }

      const feeStructure = await prisma.feeStructure.create({
        data: {
          title: body.title.trim(),
          amount,
          currency: body.currency?.trim() || DEFAULT_CURRENCY,
          programId: body.programId || null,
          level: body.level?.trim() || null,
          semester: body.semester?.trim() || null,
          intakeBatch: body.intakeBatch?.trim() || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
      });

      return NextResponse.json({ ok: true, feeStructure });
    }

    if (action === "assign_students") {
      const feeStructureId = body.feeStructureId as string;
      const studentIds = (body.studentIds as string[]) ?? [];
      if (!feeStructureId || studentIds.length === 0) {
        return NextResponse.json({ error: "Fee structure and students are required." }, { status: 400 });
      }

      const feeStructure = await prisma.feeStructure.findUnique({ where: { id: feeStructureId } });
      if (!feeStructure) {
        return NextResponse.json({ error: "Fee structure not found." }, { status: 404 });
      }

      const created = await prisma.$transaction(
        studentIds.map((studentId) =>
          prisma.studentFeeAccount.upsert({
            where: {
              studentId_feeStructureId: { studentId, feeStructureId },
            },
            create: {
              studentId,
              feeStructureId,
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              accessLocked: true,
            },
            update: {
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              accessLocked: true,
            },
          }),
        ),
      );

      return NextResponse.json({ ok: true, count: created.length });
    }

    if (action === "record_payment") {
      const { recordPayment } = await import("@/lib/finance-service");
      const result = await recordPayment({
        studentFeeAccountId: body.studentFeeAccountId,
        amount: Number(body.amount),
        method: body.method,
        reference: body.reference,
        notes: body.notes,
        recordedById: admin.id,
        paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
      });

      return NextResponse.json({
        ok: true,
        payment: {
          id: result.payment.id,
          receiptNumber: result.payment.receiptNumber,
          amount: decimalToNumber(result.payment.amount),
          paidAt: result.payment.paidAt.toISOString(),
        },
        status: result.status,
        remaining: result.remaining,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/finance:", error);
    const message = error instanceof Error ? error.message : "Finance action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
