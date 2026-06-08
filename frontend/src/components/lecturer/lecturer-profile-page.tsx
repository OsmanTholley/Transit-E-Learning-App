"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { FormEvent, useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import type { LecturerProfilePayload } from "@/types/user-profile";
import {
  CourseList,
  InfoGrid,
  Panel,
  ProfileAvatar,
  ProfileEditForm,
  ProfilePageHeader,
  TextArea,
  FieldLabel,
  TextInput,
} from "@/components/profile/profile-ui";

type EditForm = {
  fullName: string;
  phone: string;
  bio: string;
  socialLinks: string;
  specialization: string;
  profileImage: string | null;
};

function toEditForm(data: LecturerProfilePayload): EditForm {
  const dash = (v: string) => (v === "—" ? "" : v);
  return {
    fullName: data.profile.fullName,
    phone: dash(data.profile.phone),
    bio: dash(data.profile.bio),
    socialLinks: dash(data.profile.socialLinks),
    specialization: dash(data.profile.specialization),
    profileImage: data.profile.profileImage,
  };
}

export function LecturerProfilePage() {
  const [data, setData] = useState<LecturerProfilePayload | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await requestApi<LecturerProfilePayload>("/api/lecturer/profile", {
        errorTitle: "Could not load profile",
      });
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setForm(toEditForm(result.data));
      }
      if (!result.offline) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof EditForm>(field: K, value: EditForm[K]) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/lecturer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update profile.");
      setData(json);
      setForm(toEditForm(json));
      await showSuccess("Profile updated", json.message ?? "Your profile has been saved.");
    } catch (err) {
      await showError("Could not save profile", err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LoadingState message="Loading profile…" panel minHeight={160} />
    );
  }

  if (!data || !form) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        Unable to load your profile.
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ProfilePageHeader
        title="My Profile"
        subtitle="Your teaching profile, assigned courses, and contact details."
      />

      <Panel title="Profile overview" noPadding>
        <div className="space-y-6 p-4 sm:p-5">
          <ProfileAvatar
            fullName={profile.fullName}
            profileImage={form.profileImage}
            avatarInitials={profile.avatarInitials}
            editable
            onImageChange={(url) => updateField("profileImage", url)}
          />
          <InfoGrid
            items={[
              { label: "Full name", value: profile.fullName },
              { label: "Email", value: profile.email },
              { label: "Department", value: profile.department },
              { label: "Specialization", value: profile.specialization },
              { label: "Last sign-in", value: profile.lastLoginAt ?? "Not recorded yet" },
            ]}
          />
          {profile.bio !== "—" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About me</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{profile.bio}</p>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Courses teaching">
        <CourseList courses={data.coursesTeaching} />
      </Panel>

      <Panel title="Edit profile">
        <ProfileEditForm
          onSubmit={handleSubmit}
          onReset={() => setForm(toEditForm(data))}
          saving={saving}
        >
          <div className="sm:col-span-2">
            <FieldLabel>Full name</FieldLabel>
            <TextInput value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <TextInput value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+232 …" />
          </div>
          <div>
            <FieldLabel>Specialization</FieldLabel>
            <TextInput
              value={form.specialization}
              onChange={(e) => updateField("specialization", e.target.value)}
              placeholder="e.g. Software Engineering"
            />
          </div>
          <div>
            <FieldLabel>Social links</FieldLabel>
            <TextInput value={form.socialLinks} onChange={(e) => updateField("socialLinks", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Bio / About me</FieldLabel>
            <TextArea
              value={form.bio}
              onChange={(v) => updateField("bio", v)}
              placeholder="Tell students about your background and teaching approach…"
              rows={4}
            />
          </div>
        </ProfileEditForm>
      </Panel>
    </div>
  );
}
