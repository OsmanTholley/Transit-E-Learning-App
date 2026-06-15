"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/swal";

type FinanceAccount = {
  id: string;
  studentId: string;
  studentName: string;
  email: string | null;
  feeTitle: string;
  intakeBatch: string | null;
  semester: string | null;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  complianceStatus?: string;
  requiredPercent?: number;
  requiredAmount?: number;
  isRestricted?: boolean;
  dueDate: string | null;
  accessLocked: boolean;
  currency?: string;
};

type FeeStructure = {
  id: string;
  title: string;
  amount: number;
  amountLabel: string;
  dueDate: string | null;
  intakeBatch: string | null;
  semester: string | null;
  level: string | null;
  assignedCount: number;
};

type StudentOption = {
  id: string;
  studentId: string;
  fullName: string;
  email: string | null;
};

type ProgramOption = { id: string; name: string; studentCount: number };
type DepartmentOption = { id: string; name: string; studentCount: number };

type FinanceResponse = {
  summary: {
    collected: number;
    outstanding: number;
    collectionRatio: number;
    statusCounts: { PAID: number; PARTIAL: number; UNPAID: number };
    collectedLabel: string;
    outstandingLabel: string;
    eligibleStudents?: number;
    restrictedStudents?: number;
    nearDueStudents?: number;
    overdueStudents?: number;
  };
  accounts: FinanceAccount[];
  feeStructures: FeeStructure[];
  students: StudentOption[];
  programs: ProgramOption[];
  departments: DepartmentOption[];
};

function formatLeones(amount: number): string {
  return `${amount.toLocaleString("en-SL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} leones`;
}

function statusBadge(status: FinanceAccount["status"]) {
  const styles = {
    PAID: "bg-emerald-100 text-emerald-800",
    PARTIAL: "bg-amber-100 text-amber-800",
    UNPAID: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function PieChart({ paid, partial, unpaid }: { paid: number; partial: number; unpaid: number }) {
  const total = paid + partial + unpaid || 1;
  const paidPct = (paid / total) * 100;
  const partialPct = (partial / total) * 100;
  const gradient = `conic-gradient(#059669 0 ${paidPct}%, #d97706 ${paidPct}% ${paidPct + partialPct}%, #dc2626 ${paidPct + partialPct}% 100%)`;

  return (
    <div className="flex items-center gap-6">
      <div className="h-36 w-36 rounded-full" style={{ background: gradient }} />
      <div className="space-y-2 text-sm">
        <p><span className="inline-block h-2 w-2 rounded-full bg-emerald-600" /> Paid: {paid}</p>
        <p><span className="inline-block h-2 w-2 rounded-full bg-amber-600" /> Partial: {partial}</p>
        <p><span className="inline-block h-2 w-2 rounded-full bg-red-600" /> Unpaid: {unpaid}</p>
      </div>
    </div>
  );
}

export function AdminFinanceDashboard() {
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const [feeTitle, setFeeTitle] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeDueDate, setFeeDueDate] = useState("");
  const [feeRequiredPercent, setFeeRequiredPercent] = useState("50");
  const [feeIntake, setFeeIntake] = useState("");
  const [feeSemester, setFeeSemester] = useState("");

  const [assignFeeId, setAssignFeeId] = useState("");
  const [assignMode, setAssignMode] = useState<"students" | "program" | "department">("students");
  const [assignProgramId, setAssignProgramId] = useState("");
  const [assignDepartmentId, setAssignDepartmentId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editFeeTitle, setEditFeeTitle] = useState("");
  const [editFeeAmount, setEditFeeAmount] = useState("");

  const load = async (status = statusFilter) => {
    setLoading(true);
    const query = status ? `?status=${status}` : "";
    const result = await requestApi<FinanceResponse>(`/api/admin/finance${query}`, { silent: true });
    setLoading(false);
    if (result.ok) {
      setData(result.data);
      if (!assignFeeId && result.data.feeStructures[0]) {
        setAssignFeeId(result.data.feeStructures[0].id);
      }
    }
  };

  useEffect(() => {
    scheduleEffectWork(() => load());
  }, []);

  const filteredAccounts = useMemo(() => data?.accounts ?? [], [data]);

  const filteredStudents = useMemo(() => {
    const students = data?.students ?? [];
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query),
    );
  }, [data?.students, studentSearch]);

  const handleCreateFee = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(feeAmount);
    if (!feeTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      await showError("Invalid fee", "Enter a title and a valid amount in leones.");
      return;
    }

    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_fee_structure",
        title: feeTitle.trim(),
        amount,
        currency: "SLE",
        dueDate: feeDueDate || undefined,
        requiredPaymentPercent: Number(feeRequiredPercent),
        intakeBatch: feeIntake.trim() || undefined,
        semester: feeSemester.trim() || undefined,
      }),
      silent: true,
    });

    if (!result.ok) {
      await showError("Could not create fee", result.offline ? "You are offline." : result.message);
      return;
    }

    await showSuccess("Fee created", "You can now assign this fee to students.");
    setFeeTitle("");
    setFeeAmount("");
    setFeeDueDate("");
    setFeeIntake("");
    setFeeSemester("");
    void load();
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  };

  const handleAssignFees = async (event: FormEvent) => {
    event.preventDefault();
    if (!assignFeeId) {
      await showError("Select a fee", "Choose which fee to assign.");
      return;
    }

    let action = "assign_students";
    let body: Record<string, unknown> = {
      action,
      feeStructureId: assignFeeId,
    };

    if (assignMode === "students") {
      if (selectedStudentIds.length === 0) {
        await showError("Select students", "Choose at least one student.");
        return;
      }
      body = { ...body, studentIds: selectedStudentIds };
    } else if (assignMode === "program") {
      if (!assignProgramId) {
        await showError("Select a program", "Choose a program to assign this fee.");
        return;
      }
      action = "assign_program";
      body = { action, feeStructureId: assignFeeId, programId: assignProgramId };
    } else {
      if (!assignDepartmentId) {
        await showError("Select a department", "Choose a department to assign this fee.");
        return;
      }
      action = "assign_department";
      body = { action, feeStructureId: assignFeeId, departmentId: assignDepartmentId };
    }

    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      silent: true,
    });

    if (!result.ok) {
      await showError("Assignment failed", result.offline ? "You are offline." : result.message);
      return;
    }

    const count =
      assignMode === "students"
        ? selectedStudentIds.length
        : ((result.data as { count?: number })?.count ?? 0);

    await showSuccess("Fees assigned", `Fee assigned to ${count} student(s).`);
    setSelectedStudentIds([]);
    void load();
  };

  const startEditFee = (fee: FeeStructure) => {
    setEditingFeeId(fee.id);
    setEditFeeTitle(fee.title);
    setEditFeeAmount(String(fee.amount));
  };

  const handleUpdateFee = async (feeId: string) => {
    const amount = Number(editFeeAmount);
    if (!editFeeTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      await showError("Invalid fee", "Enter a title and valid amount.");
      return;
    }

    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_fee_structure",
        feeStructureId: feeId,
        title: editFeeTitle.trim(),
        amount,
      }),
      silent: true,
    });

    if (!result.ok) {
      await showError("Update failed", result.offline ? "You are offline." : result.message);
      return;
    }

    await showSuccess("Fee updated");
    setEditingFeeId(null);
    void load();
  };

  const handleDeleteFee = async (feeId: string, title: string) => {
    const confirmed = await showDeleteConfirm(`Archive fee "${title}"? Assigned accounts remain in the ledger.`);
    if (!confirmed) return;

    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_fee_structure", feeStructureId: feeId }),
      silent: true,
    });

    if (!result.ok) {
      await showError("Delete failed", result.offline ? "You are offline." : result.message);
      return;
    }

    await showSuccess("Fee removed", `"${title}" is no longer available for new assignments.`);
    void load();
  };

  const handlePayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!paymentAccountId || !paymentAmount) return;

    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_payment",
        studentFeeAccountId: paymentAccountId,
        amount: Number(paymentAmount),
        method: paymentMethod,
      }),
      silent: true,
    });

    if (!result.ok) {
      await showError("Payment failed", result.offline ? "You are offline." : result.message);
      return;
    }

    await showSuccess("Payment recorded", "Receipt email sent to the student.");
    setPaymentAmount("");
    void load();
  };

  const handleRemoveRestriction = async (accountId: string, studentName: string) => {
    const confirmed = await showDeleteConfirm(`Stop payment restriction for ${studentName}?`);
    if (!confirmed) return;
    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_restriction", studentFeeAccountId: accountId }),
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not remove restriction", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Restriction removed", `${studentName} can access content again.`);
    void load();
  };

  const handleExtendDueDate = async (accountId: string, studentName: string, currentDue: string | null) => {
    const nextDue = window.prompt(
      `Extend due date for ${studentName}`,
      currentDue ? new Date(currentDue).toISOString().slice(0, 10) : "",
    );
    if (!nextDue) return;
    const result = await requestApi("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend_due_date", studentFeeAccountId: accountId, dueDate: nextDue }),
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not extend due date", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Due date updated");
    void load();
  };

  const exportLedger = () => {
    const query = statusFilter ? `?export=csv&status=${statusFilter}` : "?export=csv";
    window.open(`/api/admin/finance${query}`, "_blank");
  };

  if (loading && !data) {
    return <p className="text-slate-600">Loading finance dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Finance & Fees</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create fees in leones, assign them to students, and track collections across the roster.
          </p>
        </div>
        <button
          type="button"
          onClick={exportLedger}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Export ledger CSV
        </button>
      </div>

      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Collected</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{data.summary.collectedLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Outstanding</p>
            <p className="mt-2 text-2xl font-semibold text-red-700">{data.summary.outstandingLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Eligible students</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{data.summary.eligibleStudents ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Restricted students</p>
            <p className="mt-2 text-2xl font-semibold text-red-700">{data.summary.restrictedStudents ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Near due / overdue</p>
            <p className="mt-2 text-2xl font-semibold text-amber-700">
              {(data.summary.nearDueStudents ?? 0) + (data.summary.overdueStudents ?? 0)}
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleCreateFee} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Create a fee</h2>
        <p className="mt-1 text-sm text-slate-600">All amounts are in Sierra Leonean leones (SLE).</p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            value={feeTitle}
            onChange={(event) => setFeeTitle(event.target.value)}
            placeholder="Fee title (e.g. Tuition — Semester 1)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="number"
            min="1"
            step="0.01"
            value={feeAmount}
            onChange={(event) => setFeeAmount(event.target.value)}
            placeholder="Amount (leones)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={feeDueDate}
            onChange={(event) => setFeeDueDate(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={feeRequiredPercent}
            onChange={(event) => setFeeRequiredPercent(event.target.value)}
            placeholder="Required %"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-[#0B3D91] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3580]"
          >
            Create fee
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={feeIntake}
            onChange={(event) => setFeeIntake(event.target.value)}
            placeholder="Intake batch (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={feeSemester}
            onChange={(event) => setFeeSemester(event.target.value)}
            placeholder="Semester (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </form>

      {data && data.feeStructures.length > 0 ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Manage fees</h2>
            <p className="mt-1 text-sm text-slate-600">
              Edit or remove fee templates. Students in the same program can have different fees by assigning separate fee amounts.
            </p>
            <ul className="mt-4 divide-y divide-slate-100">
              {data.feeStructures.map((fee) => (
                <li key={fee.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  {editingFeeId === fee.id ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <input
                        value={editFeeTitle}
                        onChange={(event) => setEditFeeTitle(event.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={editFeeAmount}
                        onChange={(event) => setEditFeeAmount(event.target.value)}
                        className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void handleUpdateFee(fee.id)}
                        className="rounded-md bg-[#0B3D91] px-3 py-2 text-sm text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFeeId(null)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-slate-900">{fee.title}</p>
                        <p className="text-sm text-slate-500">
                          {fee.amountLabel} · {fee.assignedCount} assigned
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditFee(fee)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteFee(fee.id, fee.title)}
                          className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleAssignFees} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Assign fee</h2>
            <p className="mt-1 text-sm text-slate-600">
              Assign by individual students, entire program, or department. Each student sees only their assigned fees on billing.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["students", "program", "department"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAssignMode(mode)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-sm font-medium capitalize",
                    assignMode === mode ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={assignFeeId}
                onChange={(event) => setAssignFeeId(event.target.value)}
                required
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {data.feeStructures.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.title} — {fee.amountLabel} ({fee.assignedCount} assigned)
                  </option>
                ))}
              </select>

              {assignMode === "program" ? (
                <select
                  value={assignProgramId}
                  onChange={(event) => setAssignProgramId(event.target.value)}
                  required
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select program</option>
                  {(data.programs ?? []).map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.studentCount} students)
                    </option>
                  ))}
                </select>
              ) : null}

              {assignMode === "department" ? (
                <select
                  value={assignDepartmentId}
                  onChange={(event) => setAssignDepartmentId(event.target.value)}
                  required
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select department</option>
                  {(data.departments ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name} ({department.studentCount} students)
                    </option>
                  ))}
                </select>
              ) : null}

              {assignMode === "students" ? (
                <>
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search students…"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds(filteredStudents.map((s) => s.id))}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Select all shown
                  </button>
                </>
              ) : null}

              <button
                type="submit"
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Assign fee
              </button>
            </div>

            {assignMode === "students" ? (
              <div className="mt-4 max-h-64 overflow-y-auto rounded-md border border-slate-200">
                {filteredStudents.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500">No students match your search.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <li key={student.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="h-4 w-4 rounded accent-[#0B3D91]"
                        />
                        <span className="font-medium text-slate-900">{student.fullName}</span>
                        <span className="text-slate-500">{student.studentId}</span>
                        {student.email ? <span className="text-slate-400">{student.email}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </form>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Create a fee above, then assign it to students here.
        </div>
      )}

      {data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Payment status breakdown</h2>
          <div className="mt-4">
            <PieChart
              paid={data.summary.statusCounts.PAID}
              partial={data.summary.statusCounts.PARTIAL}
              unpaid={data.summary.statusCounts.UNPAID}
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-700">
            Filter status
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                void load(event.target.value);
              }}
              className="ml-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partially paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Fee</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Required %</th>
                <th className="px-3 py-2">Compliance</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{account.studentName}</p>
                    <p className="text-xs text-slate-500">{account.studentId}</p>
                  </td>
                  <td className="px-3 py-3">{account.feeTitle}</td>
                  <td className="px-3 py-3">{formatLeones(account.totalAmount)}</td>
                  <td className="px-3 py-3">{formatLeones(account.amountPaid)}</td>
                  <td className="px-3 py-3">{formatLeones(account.balance)}</td>
                  <td className="px-3 py-3">{account.requiredPercent ?? 100}%</td>
                  <td className="px-3 py-3">{account.complianceStatus ?? account.status}</td>
                  <td className="px-3 py-3">{account.dueDate ? new Date(account.dueDate).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {account.isRestricted ? (
                        <button
                          type="button"
                          onClick={() => void handleRemoveRestriction(account.id, account.studentName)}
                          className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          Stop restriction
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleExtendDueDate(account.id, account.studentName, account.dueDate)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Extend due
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handlePayment} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Record payment</h2>
        <p className="mt-1 text-sm text-slate-600">
          Clears access locks automatically when the fee is fully paid and emails a receipt instantly.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            value={paymentAccountId}
            onChange={(event) => setPaymentAccountId(event.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select student fee account</option>
            {filteredAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.studentName} — {account.feeTitle} (bal {formatLeones(account.balance)})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Amount (leones)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile money</option>
            <option value="card">Card</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Record & email receipt
          </button>
        </div>
      </form>
    </div>
  );
}
