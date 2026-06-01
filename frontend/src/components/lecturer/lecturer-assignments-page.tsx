"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import { Panel } from "@/components/student-management/ui";

type AssignmentRow = {
  id: string;
  title: string;
  course: string;
  submissions: number;
  ungraded: number;
};

export function LecturerAssignmentsPage() {
  const { data, loading } = useApiLoad<{ assignments: AssignmentRow[] }>("/api/lecturer/assignments", {
    errorTitle: "Could not load assignments",
  });

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading assignments…</p>;
  }

  const assignments = data?.assignments ?? [];

  return (
    <Panel title="Assignment grading">
      {assignments.length === 0 ? (
        <p className="text-sm text-slate-500">No assignments created yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Assignment", "Course", "Submissions", "Ungraded"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 font-medium">{a.title}</td>
                <td className="px-3 py-2">{a.course}</td>
                <td className="px-3 py-2">{a.submissions}</td>
                <td className="px-3 py-2">{a.ungraded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
