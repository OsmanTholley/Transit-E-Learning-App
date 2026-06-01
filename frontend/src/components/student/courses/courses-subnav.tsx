"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { myCoursesSubmenu } from "@/components/student/courses/course-nav-config";

export function CoursesSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm"
      aria-label="My courses sections"
    >
      <ul className="flex min-w-max gap-1">
        {myCoursesSubmenu.map((item) => {
          const isCourseDetail = /^\/student\/courses\/[0-9a-f-]{36}$/i.test(pathname);
          const active =
            !isCourseDetail &&
            (pathname === item.href ||
              (item.href === "/student/courses" && pathname === "/student/courses") ||
              (item.href !== "/student/courses" && pathname.startsWith(`${item.href}`)));

          const label = "sidebarLabel" in item && item.sidebarLabel ? item.sidebarLabel : item.label;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "block whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "bg-[#0B3D91] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
