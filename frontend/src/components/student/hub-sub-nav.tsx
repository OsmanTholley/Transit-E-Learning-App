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
    <nav aria-label={ariaLabel} className="overflow-x-auto-touch -mx-1 px-1 pb-1">
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const active = checkActive(item, pathname, activeFilter);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-[#0B3D91] text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
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
