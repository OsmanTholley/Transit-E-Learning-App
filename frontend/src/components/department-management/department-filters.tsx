"use client";

import { departmentStatuses } from "@/services/department-management-data";
import { FieldLabel, SelectInput, TextInput } from "@/components/student-management/ui";

export type DepartmentFilterValues = {
  search: string;
  status: string;
  size: string;
};

const sizeOptions = ["", "0–100 students", "100–500", "500+"];

type Props = {
  values: DepartmentFilterValues;
  onChange: (patch: Partial<DepartmentFilterValues>) => void;
  inline?: boolean;
};

export function DepartmentFilters({ values, onChange, inline }: Props) {
  const grid = inline
    ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  const fields = (
    <div className={grid}>
      <div className="sm:col-span-2">
        <FieldLabel>Search</FieldLabel>
        <TextInput
          placeholder="Name, code, or head…"
          value={values.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel>Status</FieldLabel>
        <SelectInput
          options={[...departmentStatuses]}
          value={values.status}
          onChange={(e) => onChange({ status: e.target.value })}
        />
      </div>
      <div>
        <FieldLabel>Student count</FieldLabel>
        <SelectInput
          options={sizeOptions}
          value={values.size}
          onChange={(e) => onChange({ size: e.target.value })}
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

export function matchesDepartmentSize(totalStudents: number, size: string): boolean {
  if (!size) return true;
  if (size === "0–100 students") return totalStudents <= 100;
  if (size === "100–500") return totalStudents > 100 && totalStudents <= 500;
  if (size === "500+") return totalStudents > 500;
  return true;
}
