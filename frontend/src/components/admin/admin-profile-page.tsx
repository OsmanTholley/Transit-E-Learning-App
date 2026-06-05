"use client";

import { FormEvent, useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import type { AdminProfilePayload } from "@/types/user-profile";
import {
  InfoGrid,
  Panel,
  PermissionsList,
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
  profileImage: string | null;
};

function toEditForm(data: AdminProfilePayload): EditForm {
  const dash = (v: string) => (v === "—" ? "" : v);
  return {
    fullName: data.profile.fullName,
    phone: dash(data.profile.phone),
    bio: dash(data.profile.bio),
    socialLinks: dash(data.profile.socialLinks),
    profileImage: data.profile.profileImage,
  };
}

export function AdminProfilePage() {
  const [data, setData] = useState<AdminProfilePayload | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await requestApi<AdminProfilePayload>("/api/admin/profile", {
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
      const res = await fetch("/api/admin/profile", {
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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading profile…</p>
      </div>
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
        title="Administrator Profile"
        subtitle="Your account details, access level, and contact information."
      />

      <Panel title="Account" noPadding>
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
              { label: "Role", value: "Administrator" },
              { label: "Access level", value: profile.adminLevel },
              { label: "Last sign-in", value: profile.lastLoginAt ?? "Not recorded yet" },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Role & permissions">
        <PermissionsList permissions={profile.permissions} />
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
            <TextInput value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Social links</FieldLabel>
            <TextInput value={form.socialLinks} onChange={(e) => updateField("socialLinks", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Bio / About me</FieldLabel>
            <TextArea value={form.bio} onChange={(v) => updateField("bio", v)} />
          </div>
        </ProfileEditForm>
      </Panel>
    </div>
  );
}
