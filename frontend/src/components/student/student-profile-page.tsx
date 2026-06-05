"use client";

import { FormEvent, useEffect, useState } from "react";
import { useStudentSession } from "@/contexts/student-session-context";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import type { StudentProfilePayload } from "@/types/user-profile";
import {
  ActivityList,
  CourseList,
  GradesTable,
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
  learningGoals: string;
  achievements: string;
  profileImage: string | null;
};

function toEditForm(data: StudentProfilePayload): EditForm {
  const dash = (v: string) => (v === "—" ? "" : v);
  return {
    fullName: data.profile.fullName,
    phone: dash(data.profile.phone),
    bio: dash(data.profile.bio),
    socialLinks: dash(data.profile.socialLinks),
    learningGoals: dash(data.profile.learningGoals),
    achievements: dash(data.profile.achievements),
    profileImage: data.profile.profileImage,
  };
}

export function StudentProfilePage() {
  const { refresh: refreshSession } = useStudentSession();
  const [data, setData] = useState<StudentProfilePayload | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await requestApi<StudentProfilePayload>("/api/student/profile", {
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
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update profile.");
      setData(json);
      setForm(toEditForm(json));
      await refreshSession();
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
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <ProfilePageHeader
        title="My Profile"
        subtitle="View your academic record, grades, and update your personal details."
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
              { label: "Student ID", value: profile.studentId },
              { label: "Department", value: profile.department },
              { label: "Program", value: profile.program },
              { label: "Year / Semester", value: `${profile.year} · ${profile.semester}` },
              { label: "Last sign-in", value: profile.lastLoginAt ?? "Not recorded yet" },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Courses enrolled">
        <CourseList courses={data.enrolledCourses} />
      </Panel>

      <Panel title="Recent activity">
        <ActivityList items={data.recentActivity} />
      </Panel>

      <Panel title="Assignment & quiz grades">
        <GradesTable grades={data.grades} />
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
            <FieldLabel>Social links</FieldLabel>
            <TextInput
              value={form.socialLinks}
              onChange={(e) => updateField("socialLinks", e.target.value)}
              placeholder="LinkedIn, portfolio…"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Bio / About me</FieldLabel>
            <TextArea value={form.bio} onChange={(v) => updateField("bio", v)} placeholder="A short introduction…" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Learning goals</FieldLabel>
            <TextArea
              value={form.learningGoals}
              onChange={(v) => updateField("learningGoals", v)}
              placeholder="What you want to achieve this semester…"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Achievements & certificates</FieldLabel>
            <TextArea
              value={form.achievements}
              onChange={(v) => updateField("achievements", v)}
              placeholder="Awards, certifications, competitions…"
            />
          </div>
        </ProfileEditForm>
      </Panel>
    </div>
  );
}
