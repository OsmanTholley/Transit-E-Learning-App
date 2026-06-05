export function avatarInitials(fullName: string): string {
  return (
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function formatProfileDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function emptyToDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function adminPermissions(adminLevel: string | null | undefined): string[] {
  const level = adminLevel?.trim().toLowerCase();
  if (level === "super" || level === "super admin") {
    return [
      "Full platform access",
      "Manage students and lecturers",
      "Approve and publish content",
      "System settings and reports",
      "Activity logs and audits",
    ];
  }
  return [
    "Manage students and lecturers",
    "Review course content",
    "View reports and analytics",
    "Send announcements and notifications",
  ];
}
