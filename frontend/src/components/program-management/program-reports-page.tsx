"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useApiLoad } from "@/hooks/use-api-load";
import { usePrograms } from "@/hooks/use-programs";
import { Panel, StatCard, StudentSection } from "@/components/student-management/ui";

export function ProgramReportsPage() {
  const { programs, loading: programsLoading } = usePrograms();
  const { data, loading: overviewLoading } = useApiLoad<{
    stats: {
      totalPrograms: number;
      activePrograms: number;
      totalStudents: number;
      totalCourses: number;
    };
    submissionRate: number;
  }>("/api/admin/academic-overview", { errorTitle: "Could not load program reports" });

  const loading = programsLoading || (overviewLoading && !data);
  const reports = [
    { name: "Program List", formats: ["PDF", "Excel", "CSV"] },
    { name: "Enrollment by Program", formats: ["PDF", "Excel"] },
    { name: "Course Mapping", formats: ["PDF", "CSV"] },
    { name: "Department Summary", formats: ["PDF", "Excel"] },
  ];

  if (loading) {
    return <LoadingState message="Loading program reports…" layout="inline" />;
  }

  const stats = data?.stats;

  return (
    <StudentSection>
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Programs" value={stats.totalPrograms} tone="amber" />
          <StatCard label="Active Programs" value={stats.activePrograms} tone="blue" />
          <StatCard label="Enrolled Students" value={stats.totalStudents} tone="amber" />
          <StatCard label="Linked Courses" value={stats.totalCourses} tone="slate" />
        </div>
      ) : null}

      <Panel title="Programs by enrollment">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Program", "Department", "Students", "Courses", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programs.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{p.department}</td>
                  <td className="px-3 py-2">{p.totalStudents}</td>
                  <td className="px-3 py-2">{p.totalCourses}</td>
                  <td className="px-3 py-2">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Academic activity">
        <p className="text-sm text-slate-600">
          Assignment grading completion across the platform:{" "}
          <strong>{data?.submissionRate ?? 0}%</strong>
        </p>
      </Panel>

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
