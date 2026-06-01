"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { CourseCard as CourseCardType } from "@/types/student-courses";

function CourseThumbnail({ type }: { type: string }) {
  const base = "flex h-full w-full items-center justify-center text-white/90";
  if (type === "code") {
    return <span className={`${base} font-mono text-lg font-bold`}>{`</>`}</span>;
  }
  if (type === "database") {
    return (
      <div className={`${base} gap-1`}>
        <div className="h-8 w-5 rounded-t-full bg-white/30" />
        <div className="h-10 w-6 rounded-t-full bg-white/40" />
      </div>
    );
  }
  if (type === "engineering") {
    return (
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/90" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="32" height="32" rx="4" />
        <path d="M16 24h16M24 16v16" />
      </svg>
    );
  }
  return <span className={`${base} text-2xl font-bold`}>∑</span>;
}

export function CourseCard({ course, index = 0 }: { course: CourseCardType; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-lg"
    >
      <div className={`relative h-36 bg-gradient-to-br ${course.thumbnailBg}`}>
        <CourseThumbnail type={course.thumbnail} />
        <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-[#0B3D91]">
          {course.code}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-900 line-clamp-2">{course.title}</h3>
        <p className="mt-1 text-sm text-slate-500">Lecturer: {course.lecturerName}</p>
        <p className="text-xs text-slate-400">
          {course.department} · {course.semester ?? "—"}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{course.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${course.progress >= 100 ? "bg-emerald-500" : "bg-[#FFC107]"}`}
            />
          </div>
        </div>
        <Link
          href={`/student/courses/${course.id}`}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#0B3D91] py-2.5 text-sm font-semibold text-white transition hover:bg-[#092d6b]"
        >
          Continue Learning
        </Link>
      </div>
    </motion.article>
  );
}
