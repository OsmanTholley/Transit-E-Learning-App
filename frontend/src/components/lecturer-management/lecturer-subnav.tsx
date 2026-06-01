"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lecturerSubmenu } from "@/services/lecturer-management-data";

export function LecturerSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm"
      aria-label="Lecturer management sections"
    >
      <ul className="flex flex-wrap gap-1">
        {lecturerSubmenu.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/admin/lecturers/all" && pathname === "/admin/lecturers");
          const label = "sidebarLabel" in item && item.sidebarLabel ? item.sidebarLabel : item.label;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "block rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
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
