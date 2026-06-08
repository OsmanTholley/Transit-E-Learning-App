import { prisma } from "@/lib/prisma";

export type SystemSettingKey =
  | "platform_name"
  | "registration_open"
  | "maintenance_mode"
  | "announcement_email_alerts"
  | "default_academic_year";

const DEFAULTS: { key: SystemSettingKey; value: unknown; label: string }[] = [
  { key: "platform_name", value: "Transit E-Learning", label: "Platform name" },
  { key: "registration_open", value: true, label: "Student registration open" },
  { key: "maintenance_mode", value: false, label: "Maintenance mode" },
  { key: "announcement_email_alerts", value: false, label: "Email alerts for announcements" },
  { key: "default_academic_year", value: "2025/2026", label: "Default academic year" },
];

export async function ensureSystemSettings() {
  for (const item of DEFAULTS) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value as object, label: item.label },
      update: {},
    });
  }
}

export async function getSystemSettings() {
  await ensureSystemSettings();
  const rows = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  return rows.map((row) => ({
    key: row.key,
    value: row.value,
    label: row.label ?? row.key,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function updateSystemSettings(
  updates: Record<string, unknown>,
  updatedBy?: string | null,
) {
  await ensureSystemSettings();
  const allowed = new Set(DEFAULTS.map((d) => d.key));

  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.has(key as SystemSettingKey)) continue;
    await prisma.systemSetting.update({
      where: { key },
      data: { value: value as object, updatedBy: updatedBy ?? null },
    });
  }

  return getSystemSettings();
}
