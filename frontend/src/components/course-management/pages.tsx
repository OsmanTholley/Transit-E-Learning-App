"use client";

import Link from "next/link";
import { courseCategories } from "@/services/academic-data";
import { useApiLoad } from "@/hooks/use-api-load";
import { usePrograms } from "@/hooks/use-programs";
import type { AcademicStatus, CourseRecord } from "@/types/academic";
import {
  Panel,
  PrimaryButton,
  StatCard,
  StatusBadge,
  StudentSection,
} from "@/components/student-management/ui";
import { AllCoursesList } from "./all-courses-list";
import { AddCourseForm } from "./add-course-form";
import { AssignCourseForm } from "./assign-course-form";
import { ProgramsTable } from "@/components/program-management/programs-table";

type AcademicOverview = {
  stats: {
    totalPrograms: number;
    activePrograms: number;
    totalStudents: number;
    totalCourses: number;
    activeCourses: number;
    archivedCourses: number;
    pendingCourses: number;
  };
  coursesByLevel: { level: string; count: number }[];
  semesters: { semester: string; session: string; courses: number; status: string }[];
  categories: { name: string; count: number }[];
  topCourses: CourseRecord[];
  submissionRate: number;
};

export function AllCoursesPage() {
  return <AllCoursesList />;
}

export function AddCoursePage() {
  return <AddCourseForm />;
}

export function AssignCoursesPage() {
  return <AssignCourseForm />;
}

export function ArchivedCoursesPage() {
  return <AllCoursesList statusFilter="Archived" title="Archived courses" />;
}

export function ProgramsPage() {
  const { programs, loading } = usePrograms();

  return (
    <div className="space-y-6">
      <Link href="/admin/programs/add">
        <PrimaryButton>Add Program</PrimaryButton>
      </Link>
      {loading ? (
        <p className="text-sm text-slate-500">Loading programs…</p>
      ) : (
        <ProgramsTable programs={programs} title="Academic programs" />
      )}
    </div>
  );
}

function useAcademicOverview() {
  return useApiLoad<AcademicOverview>("/api/admin/academic-overview", {
    errorTitle: "Could not load overview",
  });
}

export function CategoriesPage() {
  const { data, loading } = useAcademicOverview();
  const categories = data?.categories ?? courseCategories.map((name) => ({ name, count: 0 }));

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading categories…</p>;
  }

  return (
    <Panel title="Course Categories">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.name} className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">{cat.name}</p>
            <p className="mt-1 text-xs text-slate-500">{cat.count} course{cat.count === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function LevelsPage() {
  const { data, loading } = useAcademicOverview();

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading course years…</p>;
  }

  return (
    <Panel title="Course Years">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.coursesByLevel ?? []).map((row) => (
          <article key={row.level} className="rounded-xl border-l-4 border-amber-400 bg-white p-4 ring-1 ring-slate-200">
            <p className="text-2xl font-bold text-[#0B3D91]">{row.level}</p>
            <p className="mt-1 text-sm text-slate-500">
              {row.count} course{row.count === 1 ? "" : "s"} assigned
            </p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function SemestersPage() {
  const { data, loading } = useAcademicOverview();

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading semesters…</p>;
  }

  return (
    <Panel title="Semester & Session Management">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Semester", "Session", "Courses", "Status"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data?.semesters ?? []).map((row) => (
            <tr key={row.semester}>
              <td className="px-3 py-2 font-medium">{row.semester}</td>
              <td className="px-3 py-2">{row.session}</td>
              <td className="px-3 py-2">{row.courses}</td>
              <td className="px-3 py-2">
                <StatusBadge status={row.status as AcademicStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function CourseAnalyticsPage() {
  const { data, loading } = useAcademicOverview();

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading analytics…</p>;
  }

  const top = data?.topCourses ?? [];
  const maxStudents = Math.max(...top.map((c) => c.totalStudents), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Most active courses">
          {top.length === 0 ? (
            <p className="text-sm text-slate-500">No active courses yet.</p>
          ) : (
            <div className="space-y-3">
              {top.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>
                      {c.code} – {c.title}
                    </span>
                    <span>{c.totalStudents} students</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[#0B3D91]"
                      style={{ width: `${(c.totalStudents / maxStudents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Grading overview">
          <p className="text-sm text-slate-600">
            Assignment submissions graded: <strong>{data?.submissionRate ?? 0}%</strong>
          </p>
        </Panel>
      </div>
    </div>
  );
}

export function CourseReportsPage() {
  const { data, loading } = useAcademicOverview();
  const reports = [
    { name: "Course List", formats: ["PDF", "Excel", "CSV"] },
    { name: "Enrollment Report", formats: ["PDF", "Excel"] },
    { name: "Lecturer Assignment", formats: ["PDF", "CSV"] },
    { name: "Semester Overview", formats: ["PDF", "Excel"] },
  ];

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading reports…</p>;
  }

  const stats = data?.stats;

  return (
    <StudentSection>
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Courses" value={stats.totalCourses} tone="amber" />
          <StatCard label="Active" value={stats.activeCourses} tone="blue" />
          <StatCard label="Pending" value={stats.pendingCourses} tone="amber" />
          <StatCard label="Archived" value={stats.archivedCourses} tone="slate" />
        </div>
      ) : null}
      <Panel title="Export reports">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <article key={r.name} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
              <h3 className="font-semibold text-slate-900">{r.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Export formats: {r.formats.join(", ")}</p>
            </article>
          ))}
        </div>
      </Panel>
    </StudentSection>
  );
}
