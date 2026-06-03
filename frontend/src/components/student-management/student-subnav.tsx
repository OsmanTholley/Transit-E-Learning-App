"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { studentSubmenu } from "@/services/student-management-data";

export function StudentSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm"
      aria-label="Student management sections"
    >
      <ul className="flex flex-wrap gap-1">
        {studentSubmenu.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/admin/students/all" && pathname === "/admin/students");
          const label = "sidebarLabel" in item && item.sidebarLabel ? item.sidebarLabel : item.label;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "block rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "bg-yellow-500 text-white shadow-sm"
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
