"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { FormEvent, useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/swal";

type SettingRow = {
  key: string;
  value: unknown;
  label: string;
  updatedAt: string;
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setSettings(data.settings ?? []);
          const initial: Record<string, unknown> = {};
          for (const row of data.settings ?? []) {
            initial[row.key] = row.value;
          }
          setDraft(initial);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSettings(data.settings ?? []);
      await showSuccess("Settings saved", data.message);
    } catch (err) {
      await showError("Save failed", err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading settings from database…" layout="inline" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">System</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Configure platform behaviour — stored in the database.</p>
      </div>

      <form className="portal-card space-y-5 p-5" onSubmit={handleSave}>
        {settings.map((row) => {
          const value = draft[row.key];

          if (typeof value === "boolean") {
            return (
              <label key={row.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="text-xs text-slate-500">Last updated {new Date(row.updatedAt).toLocaleString()}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [row.key]: e.target.checked }))}
                  className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </label>
            );
          }

          return (
            <label key={row.key} className="block">
              <span className="text-sm font-semibold text-slate-900">{row.label}</span>
              <input
                type="text"
                value={String(value ?? "")}
                onChange={(e) => setDraft((prev) => ({ ...prev, [row.key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
              />
            </label>
          );
        })}

        <button
          type="submit"
          disabled={saving}
          className="portal-accent-btn rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
