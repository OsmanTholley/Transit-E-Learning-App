"use client";

import { myCoursesSubmenu } from "@/components/student/courses/course-nav-config";
import { HubSubNav, type HubNavItem } from "@/components/student/hub-sub-nav";

function coursesNavActive(
  item: HubNavItem,
  pathname: string,
  activeFilter: string | null
) {
  if (item.slug === "completed") {
    return pathname === "/student/courses" && activeFilter === "completed";
  }
  if (item.slug === "") {
    return pathname === "/student/courses" && activeFilter !== "completed";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function CoursesSubNav({ activeFilter }: { activeFilter: string | null }) {
  return (
    <HubSubNav
      items={myCoursesSubmenu}
      ariaLabel="Course views"
      basePath="/student/courses"
      activeFilter={activeFilter}
      isActive={coursesNavActive}
    />
  );
}
