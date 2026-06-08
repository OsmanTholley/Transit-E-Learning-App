"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type HubNavItem = {
  label: string;
  sidebarLabel?: string;
  href: string;
  slug: string;
};

function navLabel(item: HubNavItem) {
  return item.sidebarLabel ?? item.label;
}

export function defaultHubNavActive(
  item: HubNavItem,
  pathname: string,
  activeFilter: string | null,
  basePath: string
) {
  if (item.href.includes("?")) {
    const [path, query] = item.href.split("?");
    const params = new URLSearchParams(query);
    const filter = params.get("filter");
    return pathname === path && activeFilter === filter;
  }

  if (item.slug === "") {
    return pathname === basePath && !activeFilter;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function HubSubNav({
  items,
  ariaLabel,
  basePath,
  activeFilter = null,
  isActive,
}: {
  items: readonly HubNavItem[];
  ariaLabel: string;
  basePath: string;
  activeFilter?: string | null;
  isActive?: (item: HubNavItem, pathname: string, activeFilter: string | null) => boolean;
}) {
  const pathname = usePathname();
  const checkActive = isActive ?? ((item, path, filter) => defaultHubNavActive(item, path, filter, basePath));

  return (
    <nav
      aria-label={ariaLabel}
      className="subnav-scroll w-full rounded-xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="flex min-w-max items-stretch">
        {items.map((item) => {
          const active = checkActive(item, pathname, activeFilter);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex shrink-0 items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-[#FFC107] font-semibold text-[#0B3D91]"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:text-slate-900",
              ].join(" ")}
            >
              {navLabel(item)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
