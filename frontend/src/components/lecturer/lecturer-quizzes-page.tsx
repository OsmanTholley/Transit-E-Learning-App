"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import { Panel } from "@/components/student-management/ui";

type QuizRow = {
  id: string;
  title: string;
  course: string;
  attempts: number;
  averageScore: number;
};

export function LecturerQuizzesPage() {
  const { data, loading } = useApiLoad<{ quizzes: QuizRow[] }>("/api/lecturer/quizzes", {
    errorTitle: "Could not load quizzes",
  });

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading quizzes…</p>;
  }

  const quizzes = data?.quizzes ?? [];

  return (
    <Panel title="Quiz management">
      {quizzes.length === 0 ? (
        <p className="text-sm text-slate-500">No quizzes created yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Quiz", "Course", "Attempts", "Average score"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quizzes.map((q) => (
              <tr key={q.id}>
                <td className="px-3 py-2 font-medium">{q.title}</td>
                <td className="px-3 py-2">{q.course}</td>
                <td className="px-3 py-2">{q.attempts}</td>
                <td className="px-3 py-2">{q.averageScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
