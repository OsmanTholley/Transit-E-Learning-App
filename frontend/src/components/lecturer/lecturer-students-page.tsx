"use client";

import { useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { useLecturerCourses } from "@/components/lecturer/lecturer-ui";
import { Panel } from "@/components/student-management/ui";

type StudentRow = {
  id: string;
  studentIdCode: string;
  fullName: string;
  email: string;
  course: string;
  department: string;
  program: string;
  enrolledAt: string;
};

export function LecturerStudentsPage() {
  const { data: coursesData } = useLecturerCourses();
  const [courseFilter, setCourseFilter] = useState("");

  const url = courseFilter
    ? `/api/lecturer/students?courseId=${encodeURIComponent(courseFilter)}`
    : "/api/lecturer/students";

  const { data, loading } = useApiLoad<{ students: StudentRow[] }>(url, {
    errorTitle: "Could not load students",
  });

  const students = data?.students ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm">
        <h2 className="text-xl font-bold">My students</h2>
        <p className="mt-2 text-sm text-blue-100">
          Students enrolled in your courses (matched by program, department, year, and semester when
          admin assigns courses).
        </p>
      </section>

      <Panel title="Enrolled students">
        <div className="mb-4 max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Filter by course
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All courses</option>
              {(coursesData?.courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading && !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-500">
            No enrolled students yet. Ensure admin assigned your course with program/year/semester and
            students have matching profiles.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  {["ID", "Name", "Email", "Course", "Department", "Program", "Enrolled"].map((h) => (
                    <th key={h} className="px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={`${s.id}-${s.course}`}>
                    <td className="px-3 py-2 font-mono text-xs">{s.studentIdCode}</td>
                    <td className="px-3 py-2 font-medium">{s.fullName}</td>
                    <td className="px-3 py-2">{s.email}</td>
                    <td className="px-3 py-2">{s.course}</td>
                    <td className="px-3 py-2">{s.department}</td>
                    <td className="px-3 py-2">{s.program}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
