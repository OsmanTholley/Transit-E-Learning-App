"use client";

import Link from "next/link";
import { useApiLoad } from "@/hooks/use-api-load";
import type { LecturerDashboardData } from "@/types/lecturer-portal";

export function LecturerDashboard() {
  const { data, loading } = useApiLoad<LecturerDashboardData>("/api/lecturer/dashboard", {
    errorTitle: "Could not load dashboard",
  });

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  if (!data) return null;

  const firstName = data.lecturerName.split(" ")[0] ?? "Lecturer";

  const stats = [
    { label: "Courses Managed", value: String(data.stats.coursesManaged) },
    { label: "Pending Grading", value: String(data.stats.pendingGrading) },
    { label: "Notes Uploaded", value: String(data.stats.notesUploaded) },
    { label: "Quizzes Created", value: String(data.stats.quizzesCreated) },
    { label: "Assignments", value: String(data.stats.assignmentsCount) },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#0B3D91] to-[#0a357f] p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Lecturer portal</p>
        <h1 className="mt-2 text-2xl font-bold">Welcome, {firstName}</h1>
        <p className="mt-2 text-sm text-blue-100">
          Monitor your classes, content, and grading from one place.
        </p>
        <Link
          href="/lecturer/courses"
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0B3D91] hover:bg-blue-50"
        >
          View my courses
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Your courses</h2>
        </div>
        <div className="p-5">
          {data.recentCourses.length === 0 ? (
            <p className="text-sm text-slate-500">No courses assigned yet. Contact the administrator.</p>
          ) : (
            <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Code</th>
                    <th className="px-3 py-2.5">Title</th>
                    <th className="px-3 py-2.5">Students</th>
                    <th className="px-3 py-2.5">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentCourses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-3 py-2.5 font-mono text-xs font-medium">{course.code}</td>
                      <td className="px-3 py-2.5 text-slate-700">{course.title}</td>
                      <td className="px-3 py-2.5">{course.students}</td>
                      <td className="px-3 py-2.5 text-slate-500">{course.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
