"use client";

import { FormEvent, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { requestApi } from "@/lib/fetch-api";
import { uploadFile, lecturerSuccess, lecturerError } from "@/components/lecturer/lecturer-ui";
import type { LecturerCoursesData } from "@/types/lecturer-portal";

export function LecturerCoursesPage() {
  const { data, loading, setData } = useApiLoad<LecturerCoursesData>("/api/lecturer/courses", {
    errorTitle: "Could not load courses",
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusUrl, setSyllabusUrl] = useState("");
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading courses…</p>;
  }

  if (!data) return null;

  const selectedCourse = data.courses.find((course) => course.id === selectedCourseId) ?? null;

  function handleSelectCourse(courseId: string) {
    setSelectedCourseId(courseId);
    const course = data!.courses.find((item) => item.id === courseId);
    if (!course) return;
    setDescription(course.description ?? "");
    setLearningOutcomes(course.learningOutcomes.join("\n"));
    setSyllabusText(course.syllabusText ?? "");
    setSyllabusUrl(course.syllabusUrl ?? "");
  }

  async function onSyllabusFile(file: File | null) {
    if (!file) return;
    setUploadingSyllabus(true);
    try {
      const uploaded = await uploadFile(file);
      setSyllabusUrl(uploaded.url);
      await lecturerSuccess("Syllabus file uploaded. Save course updates to publish.");
    } catch (e) {
      await lecturerError("Upload failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setUploadingSyllabus(false);
    }
  }

  async function handleUpdateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourseId) return;
    setSaving(true);
    const outcomes = learningOutcomes
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const result = await requestApi<{ courses: LecturerCoursesData["courses"]; message?: string }>(
      "/api/lecturer/courses",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          description,
          learningOutcomes: outcomes,
          syllabusText,
          syllabusUrl,
        }),
        errorTitle: "Could not update course",
      }
    );
    if (result.ok) {
      setData({ courses: result.data.courses });
      const fresh = result.data.courses.find((course) => course.id === selectedCourseId);
      if (fresh) {
        setDescription(fresh.description ?? "");
        setLearningOutcomes(fresh.learningOutcomes.join("\n"));
        setSyllabusText(fresh.syllabusText ?? "");
        setSyllabusUrl(fresh.syllabusUrl ?? "");
      }
      await lecturerSuccess(result.data.message ?? "Course updated successfully.");
    }
    setSaving(false);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Course management</h2>
        <p className="text-sm text-slate-500">
          Update description, outcomes, and syllabus (type in the editor or upload a PDF/DOC file for
          students to read).
        </p>
      </div>

      {data.courses.length === 0 ? (
        <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500">
          No courses assigned yet. Ask an administrator to assign courses to your account.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Code", "Title", "Department", "Program", "Level", "Semester", "Students", "Updated"].map(
                  (col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800">{course.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{course.title}</td>
                  <td className="px-4 py-3 text-slate-600">{course.department}</td>
                  <td className="px-4 py-3 text-slate-600">{course.program}</td>
                  <td className="px-4 py-3 text-slate-600">{course.level}</td>
                  <td className="px-4 py-3 text-slate-600">{course.semester}</td>
                  <td className="px-4 py-3 text-slate-600">{course.students}</td>
                  <td className="px-4 py-3 text-slate-500">{course.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.courses.length > 0 ? (
        <form
          onSubmit={handleUpdateCourse}
          className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Course content editor</h3>
            <p className="mt-1 text-xs text-slate-500">
              Students see the syllabus on the course overview page.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Course</span>
            <select
              value={selectedCourseId}
              onChange={(event) => handleSelectCourse(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91]"
              required
            >
              <option value="">Select course</option>
              {data.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Course description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              disabled={!selectedCourse}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] disabled:bg-slate-50"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Learning outcomes (one per line)
            </span>
            <textarea
              value={learningOutcomes}
              onChange={(event) => setLearningOutcomes(event.target.value)}
              rows={5}
              disabled={!selectedCourse}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] disabled:bg-slate-50"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h4 className="text-sm font-bold text-slate-900">Syllabus for students</h4>
            <p className="mt-1 text-xs text-slate-500">
              Type the syllabus below and/or upload a document. Students can read both on the course page.
            </p>
            <label className="mt-3 block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Syllabus text
              </span>
              <textarea
                value={syllabusText}
                onChange={(event) => setSyllabusText(event.target.value)}
                rows={8}
                placeholder="Week 1: Introduction…"
                disabled={!selectedCourse}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B3D91] disabled:bg-slate-50"
              />
            </label>
            <label className="mt-3 block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Syllabus file (PDF, DOC, DOCX)
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={!selectedCourse || uploadingSyllabus}
                onChange={(e) => void onSyllabusFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
              {uploadingSyllabus ? <p className="text-xs text-slate-500">Uploading…</p> : null}
              {syllabusUrl ? (
                <a
                  href={syllabusUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#0B3D91] hover:underline"
                >
                  View uploaded syllabus
                </a>
              ) : null}
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {selectedCourse ? `Editing ${selectedCourse.code} - ${selectedCourse.title}` : "No course selected"}
            </p>
            <button
              type="submit"
              disabled={!selectedCourse || saving}
              className="rounded-lg bg-[#0B3D91] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a357f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save course updates"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
