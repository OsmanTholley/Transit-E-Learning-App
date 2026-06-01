"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { programSubmenu } from "@/services/academic-data";

export function ProgramSubnav() {
  const pathname = usePathname();
  return (
    <nav className="overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
      <ul className="flex min-w-max gap-1">
        {programSubmenu.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={[
                "block whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm",
                pathname === item.href ? "bg-[#0B3D91] text-white" : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
