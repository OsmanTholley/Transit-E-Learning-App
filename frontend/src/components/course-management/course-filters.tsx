"use client";

import { FieldLabel, SelectInput, TextInput } from "@/components/student-management/ui";

export type CourseFilterValues = {
  search: string;
  department: string;
  program: string;
  status: string;
};

const statuses = ["Active", "Pending", "Archived"];

type Props = {
  values: CourseFilterValues;
  onChange: (patch: Partial<CourseFilterValues>) => void;
  departmentOptions: string[];
  programOptions: string[];
  inline?: boolean;
};

export function CourseFilters({
  values,
  onChange,
  departmentOptions,
  programOptions,
  inline,
}: Props) {
  const grid = inline
    ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  const fields = (
    <div className={grid}>
      <div className="sm:col-span-2 xl:col-span-2">
        <FieldLabel>Search</FieldLabel>
        <TextInput
          placeholder="Code, title, or lecturer…"
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
        <FieldLabel>Program</FieldLabel>
        <SelectInput
          options={programOptions}
          value={values.program}
          onChange={(e) => onChange({ program: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel>Status</FieldLabel>
        <SelectInput
          options={statuses}
          value={values.status}
          onChange={(e) => onChange({ status: e.target.value })}
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
