"use client";

import Link from "next/link";

type Props = {
  lock: {
    feeTitle?: string;
    requiredPercent: number;
    requiredAmount: number;
    amountPaid: number;
    outstandingBalance: number;
    dueDate: string | null;
    status: string;
  };
  message?: string;
};

export function PaymentLockScreen({ lock, message }: Props) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-lg flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
      <div className="text-4xl">🔒</div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Access Restricted</h2>
      <p className="mt-2 text-sm text-slate-600">
        {message ?? "Your account currently does not meet the minimum payment requirement."}
      </p>
      {lock.feeTitle ? <p className="mt-1 text-xs text-slate-500">{lock.feeTitle}</p> : null}
      <dl className="mt-6 w-full space-y-2 rounded-xl bg-white p-4 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Required payment</dt>
          <dd className="font-medium text-slate-900">{lock.requiredPercent}%</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Amount required</dt>
          <dd className="font-medium text-slate-900">Le{lock.requiredAmount.toLocaleString("en-SL", { minimumFractionDigits: 2 })}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Amount paid</dt>
          <dd className="font-medium text-emerald-700">Le{lock.amountPaid.toLocaleString("en-SL", { minimumFractionDigits: 2 })}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Outstanding</dt>
          <dd className="font-medium text-red-700">Le{lock.outstandingBalance.toLocaleString("en-SL", { minimumFractionDigits: 2 })}</dd>
        </div>
        {lock.dueDate ? (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Due date</dt>
            <dd className="font-medium text-slate-900">
              {new Date(lock.dueDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs text-slate-500">Please complete your payment to regain access.</p>
      <Link
        href="/student/billing"
        className="mt-6 inline-flex rounded-lg bg-[#0B3D91] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3580]"
      >
        Make Payment
      </Link>
    </div>
  );
}
