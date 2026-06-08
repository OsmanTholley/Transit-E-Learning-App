"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { showError, showSuccess } from "@/lib/swal";
import { useLecturers } from "@/hooks/use-lecturers";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, TextInput, StudentSection } from "@/components/student-management/ui";
import { LecturerCrudPageHero } from "./lecturer-crud-hero";
import { LecturersTable } from "./lecturers-table";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
};

export function AddLecturerForm() {
  const router = useRouter();
  const { lecturers, loading: listLoading, refetch } = useLecturers();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/lecturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save lecturer.");
      }

      await showSuccess("Lecturer created", data.message ?? "Lecturer account saved successfully.");
      router.push("/admin/lecturers/all");
      router.refresh();
    } catch (err) {
      await showError("Could not save lecturer", err instanceof Error ? err.message : "Failed to save lecturer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentSection>
      <LecturerCrudPageHero section="add" />

      <Panel title="Create lecturer account">
      <p className="mb-4 text-sm text-slate-600">
        Create login credentials for the lecturer. After signing in, they can complete their profile with phone,
        specialization, and other details.
      </p>
      <form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <FieldLabel>Full Name</FieldLabel>
          <TextInput
            placeholder="e.g. Mr. James Kamara"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            type="email"
            placeholder="lecturer@transit.edu"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Temporary Password</FieldLabel>
          <TextInput
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Lecturer"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => setForm(emptyForm)} disabled={loading}>
            Reset Form
          </SecondaryButton>
        </div>
      </form>
    </Panel>

      {!listLoading ? (
        <LecturersTable
          lecturers={lecturers.slice(0, 8)}
          title="Recent lecturers"
          onRefresh={() => void refetch()}
        />
      ) : null}
    </StudentSection>
  );
}
