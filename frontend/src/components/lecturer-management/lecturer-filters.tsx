"use client";

import { accountStatuses, verificationStatuses } from "@/services/lecturer-management-data";
import { FieldLabel, SelectInput, TextInput } from "@/components/student-management/ui";

export type LecturerFilterValues = {
  search: string;
  department: string;
  accountStatus: string;
  verificationStatus: string;
};

type Props = {
  values: LecturerFilterValues;
  onChange: (patch: Partial<LecturerFilterValues>) => void;
  departmentOptions: string[];
  inline?: boolean;
};

export function LecturerFilters({ values, onChange, departmentOptions, inline }: Props) {
  const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  const fields = (
    <div className={grid}>
      <div className="sm:col-span-2 xl:col-span-2">
        <FieldLabel>Search</FieldLabel>
        <TextInput
          placeholder="Name or email…"
          value={values.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel>Department</FieldLabel>
        <SelectInput
          options={departmentOptions}
          value={values.department}
          onChange={(e) => onChange({ department: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel>Account</FieldLabel>
        <SelectInput
          options={[...accountStatuses]}
          value={values.accountStatus}
          onChange={(e) => onChange({ accountStatus: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel>Verification</FieldLabel>
        <SelectInput
          options={[...verificationStatuses]}
          value={values.verificationStatus}
          onChange={(e) => onChange({ verificationStatus: e.target.value })}
        />
      </div>
    </div>
  );

  if (inline) return fields;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</p>
      {fields}
    </div>
  );
}
