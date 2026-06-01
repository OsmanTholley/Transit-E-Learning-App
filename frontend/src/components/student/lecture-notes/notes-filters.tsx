"use client";

export function NotesFilters({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
  courseId,
  onCourseChange,
  semester,
  onSemesterChange,
  courses,
  semesters,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  fileType: string;
  onFileTypeChange: (v: string) => void;
  courseId: string;
  onCourseChange: (v: string) => void;
  semester: string;
  onSemesterChange: (v: string) => void;
  courses: { id: string; code: string; title: string }[];
  semesters: string[];
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by course, topic, lecturer, or file type..."
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0B3D91]/15"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={fileType}
          onChange={(e) => onFileTypeChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
        >
          <option value="">All file types</option>
          <option value="PDF">PDF</option>
          <option value="DOCX">DOCX</option>
          <option value="PPT">PPT</option>
        </select>
        <select
          value={courseId}
          onChange={(e) => onCourseChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
        <select
          value={semester}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
        >
          <option value="">All semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
