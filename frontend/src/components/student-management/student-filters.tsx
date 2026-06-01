"use client";

import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { useDepartments } from "@/hooks/use-departments";
import { usePrograms } from "@/hooks/use-programs";
import { statuses } from "@/services/student-management-data";
import { FieldLabel, SelectInput, TextInput } from "./ui";

export type StudentFilterValues = {
  search: string;
  department: string;
  year: string;
  program: string;
  status: string;
};

type Props = {
  values: StudentFilterValues;
  onChange: (patch: Partial<StudentFilterValues>) => void;
  inline?: boolean;
};

export function StudentFilters({ values, onChange, inline }: Props) {
  const { departments } = useDepartments();
  const { programs } = usePrograms();
  const departmentOptions = ["", ...departments.map((d) => d.name)];
  const programOptions = ["", ...programs.map((p) => p.name)];
  const yearOptions = ["", ...ACADEMIC_YEARS];

  const grid = inline
    ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";

  const fields = (
    <div className={grid}>
      <div className="sm:col-span-2 xl:col-span-2">
        <FieldLabel>Search</FieldLabel>
        <TextInput
          placeholder="Name, ID, or email…"
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
        <FieldLabel>Year</FieldLabel>
        <SelectInput
          options={yearOptions}
          value={values.year}
          onChange={(e) => onChange({ year: e.target.value })}
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
          options={[...statuses]}
          value={values.status}
          onChange={(e) => onChange({ status: e.target.value })}
        />
      </div>
    </div>
  );

  if (inline) {
    return fields;
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</p>
      {fields}
    </div>
  );
}
