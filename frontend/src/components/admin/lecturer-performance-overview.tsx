"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminLecturerPerformance } from "@/types/admin-dashboard";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function LecturerPerformanceOverview({
  performance,
}: {
  performance: AdminLecturerPerformance;
}) {
  const maxCourses = Math.max(...performance.topLecturers.map((l) => l.courseCount), 1);

  return (
    <div id="lecturer-performance" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Lecturer performance</h2>
          <p className="mt-0.5 text-xs text-slate-500">Teaching activity, uploads, and engagement overview</p>
        </div>
        <Link
          href="/admin/lecturers/all"
          className="text-xs font-semibold text-yellow-700 hover:underline"
        >
          Manage lecturers
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active lecturers", value: performance.activeLecturers },
          { label: "Notes uploaded", value: performance.notesUploaded },
          { label: "Quizzes created", value: performance.quizzesCreated },
          { label: "Assignments", value: performance.assignmentsCount },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-200/80 border-l-4 border-l-yellow-500 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Courses by top lecturers">
          {performance.topLecturers.length === 0 ? (
            <p className="text-sm text-slate-500">No lecturers with assigned courses yet.</p>
          ) : (
            <div className="space-y-3">
              {performance.topLecturers.map((row) => (
                <div key={row.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700">{row.name}</span>
                    <span className="font-semibold text-slate-900">
                      {row.courseCount} course{row.courseCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${(row.courseCount / maxCourses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Content summary">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs text-slate-500">Lecture notes</dt>
              <dd className="text-lg font-bold text-slate-900">{performance.notesUploaded}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs text-slate-500">Quizzes</dt>
              <dd className="text-lg font-bold text-slate-900">{performance.quizzesCreated}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">
              <dt className="text-xs text-slate-500">Assignments</dt>
              <dd className="text-lg font-bold text-slate-900">{performance.assignmentsCount}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
