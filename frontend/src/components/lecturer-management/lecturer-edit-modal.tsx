"use client";

import { FormEvent, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showSuccess } from "@/lib/swal";
import { LecturerRecord } from "@/types/lecturer";

type EditForm = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  isVerified: boolean;
  isActive: boolean;
};

function buildEditForm(lecturer: LecturerRecord): EditForm {
  return {
    fullName: lecturer.fullName,
    email: lecturer.email,
    phone: lecturer.phone === "—" ? "" : lecturer.phone,
    specialization: lecturer.specialization === "—" ? "" : lecturer.specialization,
    isVerified: lecturer.verificationStatus === "Verified",
    isActive: lecturer.accountStatus !== "Suspended",
  };
}

export function LecturerEditModal({
  lecturer,
  onClose,
  onSaved,
}: {
  lecturer: LecturerRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditForm>(() => buildEditForm(lecturer));
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const result = await requestApi<{ message: string }>(`/api/lecturers/${lecturer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        specialization: form.specialization || null,
        isVerified: form.isVerified,
        isActive: form.isActive,
      }),
      errorTitle: "Could not update lecturer",
    });

    setSubmitting(false);
    if (!result.ok) return;

    await showSuccess("Updated", result.data.message ?? "Lecturer saved.");
    onSaved();
    onClose();
  }

  return (
    <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lecturer-edit-title">
      <div className="admin-crud-modal admin-crud-modal--wide">
        <div className="admin-crud-modal-header admin-crud-modal-header--department">
          <div className="admin-crud-modal-header-glow" />
          <div className="admin-crud-modal-header-top">
            <div>
              <p className="admin-crud-modal-kicker">Lecturer account</p>
              <h3 id="lecturer-edit-title" className="admin-crud-modal-title">
                Edit lecturer
              </h3>
              <p className="admin-crud-modal-subtitle">{lecturer.fullName}</p>
            </div>
            <button type="button" onClick={onClose} className="admin-crud-modal-close" aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <form id="lecturer-edit-form" onSubmit={handleSubmit}>
          <div className="admin-crud-modal-body">
            <div className="admin-crud-field-grid admin-crud-field-grid--2">
              <div className="admin-crud-field">
                <label className="admin-crud-label">Full name</label>
                <input
                  className="admin-crud-input"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  required
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Email</label>
                <input
                  type="email"
                  className="admin-crud-input"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Phone</label>
                <input
                  className="admin-crud-input"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Specialization</label>
                <input
                  className="admin-crud-input"
                  value={form.specialization}
                  onChange={(e) => updateField("specialization", e.target.value)}
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Verification</label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => updateField("isVerified", e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Verified lecturer
                </label>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Account status</label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Active (can sign in)
                </label>
              </div>
            </div>
          </div>
          <div className="admin-crud-modal-footer">
            <button type="submit" disabled={submitting} className="admin-crud-btn-primary">
              {submitting ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} className="admin-crud-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
