"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, SelectInput, TextInput } from "@/components/student-management/ui";

type ProgramFormOptions = {
  departments: { id: string; name: string }[];
};

const emptyForm = {
  programName: "",
  departmentId: "",
  duration: "",
};

export function AddProgramForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState<ProgramFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const result = await requestApi<ProgramFormOptions>("/api/programs/options", {
        errorTitle: "Could not load form",
      });
      if (cancelled) return;
      if (result.ok) {
        setOptions(result.data);
      }
      if (!result.offline) {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save program.");
      }

      await showSuccess("Program created", data.message ?? "Program saved successfully.");
      router.push("/admin/programs/all");
      router.refresh();
    } catch (err) {
      await showError("Could not save program", err instanceof Error ? err.message : "Failed to save program.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOptions) {
    return (
      <Panel title="Create Program">
        <LoadingState message="Loading departments…" layout="inline" />
      </Panel>
    );
  }

  const departments = options?.departments ?? [];

  return (
    <Panel title="Create Program">
      {departments.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No admin-created departments found.{" "}
          <Link href="/admin/departments/add" className="font-semibold text-yellow-700 hover:underline">
            Add a department
          </Link>{" "}
          before creating a program.
        </div>
      ) : (
        <form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <FieldLabel>Program Name</FieldLabel>
            <TextInput
              placeholder="e.g. BSc Computer Science"
              value={form.programName}
              onChange={(e) => updateField("programName", e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel>Department</FieldLabel>
            <select
              required
              value={form.departmentId}
              onChange={(e) => updateField("departmentId", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
            >
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Duration</FieldLabel>
            <SelectInput
              options={["2 Years", "3 Years", "4 Years"]}
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Program"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setForm(emptyForm)} disabled={submitting}>
              Reset Form
            </SecondaryButton>
          </div>
        </form>
      )}
    </Panel>
  );
}
