import { NextRequest, NextResponse } from "next/server";
import { FeePaymentStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  computePaymentCompliance,
  decimalToNumber,
  DEFAULT_CURRENCY,
  formatMoney,
  getFinanceDashboardSummary,
  notifyFeeAssignment,
} from "@/lib/finance-service";
import { logActivity } from "@/lib/activity-log";
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

    const [students, programs, departments] = await Promise.all([
      prisma.student.findMany({
        include: {
          user: { select: { fullName: true, email: true } },
          program: { select: { programName: true } },
          department: { select: { departmentName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.program.findMany({
        orderBy: { programName: "asc" },
        include: { _count: { select: { students: true } } },
      }),
      prisma.department.findMany({
        orderBy: { departmentName: "asc" },
        include: { _count: { select: { students: true } } },
      }),
    ]);

    const rows = accounts.map((account) => {
      const total = decimalToNumber(account.totalAmount);
      const paid = decimalToNumber(account.amountPaid);
      const balance = Math.max(0, total - paid);
      const compliance = computePaymentCompliance(account);
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
        complianceStatus: compliance.status,
        requiredPercent: compliance.requiredPercent,
        requiredAmount: compliance.requiredAmount,
        isRestricted: compliance.isRestricted,
        dueDate: account.dueDate?.toISOString() ?? account.feeStructure.dueDate?.toISOString() ?? null,
        accessLocked: account.accessLocked,
        restrictionOverridden: account.restrictionOverridden,
        temporaryAccessUntil: account.temporaryAccessUntil?.toISOString() ?? null,
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
        eligibleStudents: summary.eligibleStudents,
        restrictedStudents: summary.restrictedStudents,
        nearDueStudents: summary.nearDueStudents,
        overdueStudents: summary.overdueStudents,
      },
      accounts: rows,
      feeStructures: feeStructures.map((fee) => ({
        id: fee.id,
        title: fee.title,
        amount: decimalToNumber(fee.amount),
        currency: fee.currency,
        amountLabel: formatMoney(fee.amount, fee.currency),
        dueDate: fee.dueDate?.toISOString() ?? null,
        requiredPaymentPercent: fee.requiredPaymentPercent,
        intakeBatch: fee.intakeBatch,
        semester: fee.semester,
        level: fee.level,
        programId: fee.programId,
        departmentId: fee.departmentId,
        assignedCount: fee._count.accounts,
      })),
      students: students.map((student) => ({
        id: student.id,
        studentId: student.studentId,
        fullName: student.user.fullName,
        email: student.user.email,
        programId: student.programId,
        departmentId: student.departmentId,
        programName: student.program?.programName ?? null,
        departmentName: student.department?.departmentName ?? null,
      })),
      programs: programs.map((program) => ({
        id: program.id,
        name: program.programName,
        studentCount: program._count.students,
      })),
      departments: departments.map((department) => ({
        id: department.id,
        name: department.departmentName,
        studentCount: department._count.students,
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
      const requiredPaymentPercent = Number(body.requiredPaymentPercent ?? 100);
      if (!body.title?.trim() || !Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Valid title and amount are required." }, { status: 400 });
      }
      if (!Number.isFinite(requiredPaymentPercent) || requiredPaymentPercent < 0 || requiredPaymentPercent > 100) {
        return NextResponse.json({ error: "Required payment percentage must be between 0 and 100." }, { status: 400 });
      }

      const feeStructure = await prisma.feeStructure.create({
        data: {
          title: body.title.trim(),
          amount,
          currency: body.currency?.trim() || DEFAULT_CURRENCY,
          programId: body.programId || null,
          departmentId: body.departmentId || null,
          level: body.level?.trim() || null,
          semester: body.semester?.trim() || null,
          intakeBatch: body.intakeBatch?.trim() || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          requiredPaymentPercent,
        },
      });

      await logActivity({
        actorId: admin.id,
        action: "PAYMENT_PLAN_CREATED",
        entityType: "fee_structure",
        entityId: feeStructure.id,
        summary: `Payment plan "${feeStructure.title}" created (${requiredPaymentPercent}% required).`,
        metadata: { amount, requiredPaymentPercent, dueDate: feeStructure.dueDate?.toISOString() ?? null },
      });

      return NextResponse.json({ ok: true, feeStructure });
    }

    if (action === "update_fee_structure") {
      const feeStructureId = body.feeStructureId as string;
      if (!feeStructureId) {
        return NextResponse.json({ error: "Fee structure id is required." }, { status: 400 });
      }

      const amount = body.amount !== undefined ? Number(body.amount) : undefined;
      if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
        return NextResponse.json({ error: "Valid amount is required." }, { status: 400 });
      }

      const feeStructure = await prisma.feeStructure.update({
        where: { id: feeStructureId },
        data: {
          ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
          ...(amount !== undefined ? { amount } : {}),
          ...(body.programId !== undefined ? { programId: body.programId || null } : {}),
          ...(body.departmentId !== undefined ? { departmentId: body.departmentId || null } : {}),
          ...(body.level !== undefined ? { level: body.level?.trim() || null } : {}),
          ...(body.semester !== undefined ? { semester: body.semester?.trim() || null } : {}),
          ...(body.intakeBatch !== undefined ? { intakeBatch: body.intakeBatch?.trim() || null } : {}),
          ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
          ...(body.requiredPaymentPercent !== undefined
            ? { requiredPaymentPercent: Number(body.requiredPaymentPercent) }
            : {}),
        },
      });

      await logActivity({
        actorId: admin.id,
        action: "PAYMENT_PLAN_UPDATED",
        entityType: "fee_structure",
        entityId: feeStructure.id,
        summary: `Payment plan "${feeStructure.title}" updated.`,
      });

      return NextResponse.json({ ok: true, feeStructure });
    }

    if (action === "delete_fee_structure") {
      const feeStructureId = body.feeStructureId as string;
      if (!feeStructureId) {
        return NextResponse.json({ error: "Fee structure id is required." }, { status: 400 });
      }

      await prisma.feeStructure.update({
        where: { id: feeStructureId },
        data: { isActive: false },
      });

      return NextResponse.json({ ok: true });
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
              requiredPaymentPercent: feeStructure.requiredPaymentPercent,
              accessLocked: true,
            },
            update: {
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              requiredPaymentPercent: feeStructure.requiredPaymentPercent,
              accessLocked: true,
            },
          }),
        ),
      );

      const assignedStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, userId: true },
      });
      await Promise.all(
        assignedStudents.map((student) =>
          notifyFeeAssignment({
            studentUserId: student.userId,
            feeTitle: feeStructure.title,
            requiredPercent: feeStructure.requiredPaymentPercent,
            dueDate: feeStructure.dueDate,
          }),
        ),
      );

      await logActivity({
        actorId: admin.id,
        action: "PAYMENT_PERCENTAGE_ASSIGNED",
        entityType: "fee_structure",
        entityId: feeStructureId,
        summary: `Payment requirement assigned to ${created.length} student(s).`,
        metadata: { requiredPaymentPercent: feeStructure.requiredPaymentPercent, count: created.length },
      });

      return NextResponse.json({ ok: true, count: created.length });
    }

    if (action === "assign_program") {
      const feeStructureId = body.feeStructureId as string;
      const programId = body.programId as string;
      if (!feeStructureId || !programId) {
        return NextResponse.json({ error: "Fee structure and program are required." }, { status: 400 });
      }

      const [feeStructure, studentsInProgram] = await Promise.all([
        prisma.feeStructure.findUnique({ where: { id: feeStructureId } }),
        prisma.student.findMany({
          where: { programId, user: { isActive: true } },
          select: { id: true },
        }),
      ]);

      if (!feeStructure || !feeStructure.isActive) {
        return NextResponse.json({ error: "Fee structure not found." }, { status: 404 });
      }
      if (studentsInProgram.length === 0) {
        return NextResponse.json({ error: "No active students in this program." }, { status: 400 });
      }

      const created = await prisma.$transaction(
        studentsInProgram.map((student) =>
          prisma.studentFeeAccount.upsert({
            where: { studentId_feeStructureId: { studentId: student.id, feeStructureId } },
            create: {
              studentId: student.id,
              feeStructureId,
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              requiredPaymentPercent: feeStructure.requiredPaymentPercent,
              accessLocked: true,
            },
            update: {
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              requiredPaymentPercent: feeStructure.requiredPaymentPercent,
              accessLocked: true,
            },
          }),
        ),
      );

      return NextResponse.json({ ok: true, count: created.length });
    }

    if (action === "assign_department") {
      const feeStructureId = body.feeStructureId as string;
      const departmentId = body.departmentId as string;
      if (!feeStructureId || !departmentId) {
        return NextResponse.json({ error: "Fee structure and department are required." }, { status: 400 });
      }

      const [feeStructure, studentsInDepartment] = await Promise.all([
        prisma.feeStructure.findUnique({ where: { id: feeStructureId } }),
        prisma.student.findMany({
          where: { departmentId, user: { isActive: true } },
          select: { id: true },
        }),
      ]);

      if (!feeStructure || !feeStructure.isActive) {
        return NextResponse.json({ error: "Fee structure not found." }, { status: 404 });
      }
      if (studentsInDepartment.length === 0) {
        return NextResponse.json({ error: "No active students in this department." }, { status: 400 });
      }

      const created = await prisma.$transaction(
        studentsInDepartment.map((student) =>
          prisma.studentFeeAccount.upsert({
            where: { studentId_feeStructureId: { studentId: student.id, feeStructureId } },
            create: {
              studentId: student.id,
              feeStructureId,
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              requiredPaymentPercent: feeStructure.requiredPaymentPercent,
              accessLocked: true,
            },
            update: {
              totalAmount: feeStructure.amount,
              dueDate: feeStructure.dueDate,
              requiredPaymentPercent: feeStructure.requiredPaymentPercent,
              accessLocked: true,
            },
          }),
        ),
      );

      return NextResponse.json({ ok: true, count: created.length });
    }

    if (action === "remove_restriction") {
      const accountId = body.studentFeeAccountId as string;
      if (!accountId) return NextResponse.json({ error: "Account id is required." }, { status: 400 });
      const account = await prisma.studentFeeAccount.update({
        where: { id: accountId },
        data: { restrictionOverridden: true, accessLocked: false },
      });
      await logActivity({
        actorId: admin.id,
        action: "RESTRICTION_REMOVED",
        entityType: "student_fee_account",
        entityId: accountId,
        summary: "Admin removed payment restriction override.",
      });
      return NextResponse.json({ ok: true, account });
    }

    if (action === "extend_due_date") {
      const accountId = body.studentFeeAccountId as string;
      const dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (!accountId || !dueDate) {
        return NextResponse.json({ error: "Account id and due date are required." }, { status: 400 });
      }
      const previous = await prisma.studentFeeAccount.findUnique({ where: { id: accountId } });
      const account = await prisma.studentFeeAccount.update({
        where: { id: accountId },
        data: { dueDate },
      });
      await logActivity({
        actorId: admin.id,
        action: "DUE_DATE_CHANGED",
        entityType: "student_fee_account",
        entityId: accountId,
        summary: "Admin extended payment due date.",
        metadata: {
          previousValue: previous?.dueDate?.toISOString() ?? null,
          newValue: dueDate.toISOString(),
        },
      });
      return NextResponse.json({ ok: true, account });
    }

    if (action === "update_required_percent") {
      const accountId = body.studentFeeAccountId as string;
      const requiredPaymentPercent = Number(body.requiredPaymentPercent);
      if (!accountId || !Number.isFinite(requiredPaymentPercent)) {
        return NextResponse.json({ error: "Account id and required percent are required." }, { status: 400 });
      }
      const previous = await prisma.studentFeeAccount.findUnique({ where: { id: accountId } });
      const account = await prisma.studentFeeAccount.update({
        where: { id: accountId },
        data: { requiredPaymentPercent },
      });
      await logActivity({
        actorId: admin.id,
        action: "PAYMENT_PERCENTAGE_ASSIGNED",
        entityType: "student_fee_account",
        entityId: accountId,
        summary: "Admin updated required payment percentage.",
        metadata: {
          previousValue: previous?.requiredPaymentPercent ?? null,
          newValue: requiredPaymentPercent,
        },
      });
      return NextResponse.json({ ok: true, account });
    }

    if (action === "grant_temporary_access") {
      const accountId = body.studentFeeAccountId as string;
      const until = body.temporaryAccessUntil ? new Date(body.temporaryAccessUntil) : null;
      if (!accountId || !until) {
        return NextResponse.json({ error: "Account id and access end date are required." }, { status: 400 });
      }
      const account = await prisma.studentFeeAccount.update({
        where: { id: accountId },
        data: { temporaryAccessUntil: until },
      });
      await logActivity({
        actorId: admin.id,
        action: "TEMPORARY_ACCESS_GRANTED",
        entityType: "student_fee_account",
        entityId: accountId,
        summary: "Admin granted temporary academic access.",
        metadata: { temporaryAccessUntil: until.toISOString() },
      });
      return NextResponse.json({ ok: true, account });
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
