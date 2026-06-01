"use client";

import { FormEvent, useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { LecturerRecord } from "@/types/lecturer";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, TextInput } from "@/components/student-management/ui";

const emptyForm = {
  fullName: "",
  phone: "",
  specialization: "",
};

export function LecturerProfilePage() {
  const [lecturer, setLecturer] = useState<LecturerRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await requestApi<{ lecturer: LecturerRecord }>("/api/lecturer/profile", {
        errorTitle: "Could not load profile",
      });
      if (cancelled) return;
      if (result.ok) {
        setLecturer(result.data.lecturer);
        setForm({
          fullName: result.data.lecturer.fullName,
          phone: result.data.lecturer.phone === "—" ? "" : result.data.lecturer.phone,
          specialization:
            result.data.lecturer.specialization === "—" ? "" : result.data.lecturer.specialization,
        });
      }
      if (!result.offline) {
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/lecturer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update profile.");
      }

      setLecturer(data.lecturer);
      await showSuccess("Profile updated", data.message ?? "Your profile has been saved.");
    } catch (err) {
      await showError("Could not save profile", err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading profile…</p>
      </div>
    );
  }

  if (!lecturer) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        Unable to load your profile.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your contact details and specialization. Sign in with your email and password.
        </p>
      </div>

      <Panel title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 font-medium text-slate-900">{lecturer.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Courses</dt>
            <dd className="mt-1 font-medium text-slate-900">{lecturer.assignedCourses}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Personal details">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <FieldLabel>Full Name</FieldLabel>
            <TextInput
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              required
            />
          </div>
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <TextInput
              placeholder="+232 …"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Specialization</FieldLabel>
            <TextInput
              placeholder="e.g. Software Engineering"
              value={form.specialization}
              onChange={(e) => updateField("specialization", e.target.value)}
            />
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={saving}
              onClick={() =>
                setForm({
                  fullName: lecturer.fullName,
                  phone: lecturer.phone === "—" ? "" : lecturer.phone,
                  specialization: lecturer.specialization === "—" ? "" : lecturer.specialization,
                })
              }
            >
              Reset
            </SecondaryButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
