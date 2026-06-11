"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentLockScreen } from "@/components/finance/payment-lock-screen";
import { requestApi } from "@/lib/fetch-api";

type BillingAccount = {
  id: string;
  feeTitle: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  complianceStatus?: string;
  requiredPercent?: number;
  requiredAmount?: number;
  progressPercent?: number;
  isRestricted?: boolean;
  dueDate: string | null;
  accessLocked: boolean;
  invoiceNumber: string;
  transactions: {
    id: string;
    amount: number;
    method: string | null;
    reference: string | null;
    receiptNumber: string;
    paidAt: string;
  }[];
};

type BillingResponse = {
  summary: {
    totalDueLabel: string;
    totalPaidLabel: string;
    outstandingLabel: string;
    outstanding: number;
    totalDue: number;
    totalPaid: number;
  };
  accounts: BillingAccount[];
};

function formatLeones(amount: number) {
  return `${amount.toLocaleString("en-SL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} leones`;
}

function statusMeta(status: string, dueDate: string | null, balance: number) {
  const overdue = dueDate && balance > 0 && new Date(dueDate).getTime() < Date.now();
  if (status === "PAID") {
    return { label: "Paid", chip: "bg-emerald-100 text-emerald-800", stripe: "bg-emerald-500", tone: "text-emerald-700" };
  }
  if (overdue) {
    return { label: "Overdue", chip: "bg-red-100 text-red-800", stripe: "bg-red-500", tone: "text-red-700" };
  }
  if (status === "PARTIAL") {
    return { label: "Partially paid", chip: "bg-amber-100 text-amber-800", stripe: "bg-amber-500", tone: "text-amber-700" };
  }
  return { label: "Due", chip: "bg-blue-100 text-blue-800", stripe: "bg-[#0B3D91]", tone: "text-[#0B3D91]" };
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#059669"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900">{percent}%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Paid</span>
      </div>
    </div>
  );
}

export function StudentBillingPortal() {
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await requestApi<BillingResponse>("/api/student/billing", { silent: true });
      setLoading(false);
      if (result.ok) setData(result.data);
    }
    void load();
  }, []);

  const overallPercent = useMemo(() => {
    if (!data || data.summary.totalDue <= 0) return 0;
    return Math.min(100, Math.round((data.summary.totalPaid / data.summary.totalDue) * 100));
  }, [data]);

  if (loading) {
    return <p className="text-slate-600">Loading your fees…</p>;
  }

  if (!data) {
    return <p className="text-slate-600">Unable to load billing information.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[#0B3D91]/15 bg-gradient-to-br from-[#0B3D91] to-[#072a66] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FFC107]">Fee summary</p>
            <h1 className="mt-2 text-2xl font-semibold">My fees & payments</h1>
            <p className="mt-2 max-w-md text-sm text-white/75">
              Track tuition, due dates, and payment history — similar to your Teachmint fee dashboard.
            </p>
          </div>
          <ProgressRing percent={overallPercent} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-white/70">Total fees</p>
            <p className="mt-1 text-lg font-semibold">{data.summary.totalDueLabel}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-white/70">Paid</p>
            <p className="mt-1 text-lg font-semibold text-emerald-200">{data.summary.totalPaidLabel}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-white/70">Outstanding</p>
            <p className="mt-1 text-lg font-semibold text-[#FFC107]">{data.summary.outstandingLabel}</p>
          </div>
        </div>
      </div>

      {data.accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No fees have been assigned to your account yet.
        </div>
      ) : (
        data.accounts.map((account) => {
          const paidPercent = account.progressPercent ?? (account.totalAmount > 0 ? Math.round((account.amountPaid / account.totalAmount) * 100) : 0);
          const meta = statusMeta(account.status, account.dueDate, account.balance);
          const expanded = expandedId === account.id;
          const restricted = account.isRestricted || (account.complianceStatus === "ACCESS_RESTRICTED");

          return (
            <article key={account.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {restricted ? (
                <div className="p-5">
                  <PaymentLockScreen
                    lock={{
                      feeTitle: account.feeTitle,
                      requiredPercent: account.requiredPercent ?? 100,
                      requiredAmount: account.requiredAmount ?? account.totalAmount,
                      amountPaid: account.amountPaid,
                      outstandingBalance: account.balance,
                      dueDate: account.dueDate,
                      status: account.complianceStatus ?? account.status,
                    }}
                  />
                </div>
              ) : null}
              <div className="flex">
                <div className={`w-1.5 shrink-0 ${meta.stripe}`} />
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{account.feeTitle}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chip}`}>{meta.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Required {account.requiredPercent ?? 100}% ({formatLeones(account.requiredAmount ?? account.totalAmount)}) · Due{" "}
                        {account.dueDate ? new Date(account.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        {" · "}Invoice {account.invoiceNumber}
                      </p>
                      {account.accessLocked && account.balance > 0 ? (
                        <p className="mt-2 inline-flex rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
                          Course access locked until this fee is cleared
                        </p>
                      ) : null}
                    </div>
                    <a
                      href={`/api/student/billing/invoice/${account.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#0B3D91] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3580]"
                    >
                      Statement
                    </a>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{formatLeones(account.totalAmount)}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Paid</p>
                      <p className="mt-1 text-base font-semibold text-emerald-800">{formatLeones(account.amountPaid)}</p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-red-700">Balance</p>
                      <p className={`mt-1 text-base font-semibold ${meta.tone}`}>{formatLeones(account.balance)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>Payment progress toward required amount</span>
                      <span>
                        Paid {formatLeones(account.amountPaid)} / Required {formatLeones(account.requiredAmount ?? account.totalAmount)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] to-emerald-500 transition-all"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : account.id)}
                    className="mt-4 text-sm font-semibold text-[#0B3D91] hover:underline"
                  >
                    {expanded ? "Hide payment history" : `View payment history (${account.transactions.length})`}
                  </button>

                  {expanded ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                      {account.transactions.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-500">No payments recorded yet.</p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {account.transactions.map((tx) => (
                            <li key={tx.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium text-slate-900">{formatLeones(tx.amount)}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(tx.paidAt).toLocaleString()} · {tx.method ?? "Payment"} · {tx.receiptNumber}
                                </p>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                Received
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
