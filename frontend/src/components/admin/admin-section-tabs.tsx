"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminSectionTabItem = {
  label: string;
  href: string;
  sidebarLabel?: string;
};

function tabLabel(item: AdminSectionTabItem) {
  return item.sidebarLabel ?? item.label;
}

function defaultIsActive(pathname: string, href: string, exact?: boolean) {
  if (pathname === href) return true;
  if (exact) return false;
  if (href.endsWith("/all")) {
    const base = href.replace(/\/all$/, "");
    return pathname === base;
  }
  return pathname.startsWith(`${href}/`);
}

export function AdminSectionTabs({
  items,
  ariaLabel,
  exact = false,
}: {
  items: readonly AdminSectionTabItem[];
  ariaLabel: string;
  exact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className="subnav-scroll rounded-xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="flex min-w-max items-stretch">
        {items.map((item) => {
          const active = defaultIsActive(pathname, item.href, exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex shrink-0 items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-yellow-500 font-semibold text-[#003B8E]"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:text-slate-900",
              ].join(" ")}
            >
              {tabLabel(item)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
