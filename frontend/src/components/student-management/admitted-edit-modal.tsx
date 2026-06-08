"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";

type AdmittedRow = {
  id: string;
  studentId: string;
  fullName: string;
  department: string;
  program: string;
  status: string;
};

type FormOptions = {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  years: string[];
};

export function AdmittedEditModal({
  row,
  onClose,
  onSaved,
}: {
  row: AdmittedRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [fullName, setFullName] = useState(row.fullName);
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [level, setLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void requestApi<FormOptions>("/api/students/options", { silent: true }).then((result) => {
      if (!result.ok) return;
      setOptions(result.data);
      const dept = result.data.departments.find((d) => d.name === row.department);
      const prog = result.data.programs.find(
        (p) => p.name === row.program && (!dept || p.departmentId === dept.id),
      );
      setDepartmentId(dept?.id ?? "");
      setProgramId(prog?.id ?? "");
    });
  }, [row]);

  const programChoices = useMemo(() => {
    if (!options || !departmentId) return [];
    return options.programs.filter((p) => p.departmentId === departmentId);
  }, [options, departmentId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      await showError("Missing name", "Full name is required.");
      return;
    }
    setSubmitting(true);
    const result = await requestApi(`/api/students/admitted/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        departmentId: departmentId || null,
        programId: programId || null,
        level: level.trim() || null,
      }),
      errorTitle: "Could not update",
    });
    setSubmitting(false);
    if (!result.ok) return;
    await showSuccess("Updated", result.data.message ?? "Admitted student saved.");
    onSaved();
    onClose();
  }

  return (
    <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true">
      <div className="admin-crud-modal">
        <div className="admin-crud-modal-header admin-crud-modal-header--department">
          <div className="admin-crud-modal-header-glow" />
          <div className="admin-crud-modal-header-top">
            <div>
              <p className="admin-crud-modal-kicker">Registration gate</p>
              <h3 className="admin-crud-modal-title">Edit admitted student</h3>
              <p className="admin-crud-modal-subtitle">{row.studentId}</p>
            </div>
            <button type="button" onClick={onClose} className="admin-crud-modal-close" aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <form id="admitted-edit-form" onSubmit={handleSubmit}>
          <div className="admin-crud-modal-body">
            <div className="admin-crud-field">
              <label className="admin-crud-label">Full name</label>
              <input
                className="admin-crud-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="admin-crud-field">
              <label className="admin-crud-label">Department</label>
              <select
                className="admin-crud-input"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setProgramId("");
                }}
              >
                <option value="">Select department…</option>
                {options?.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-crud-field">
              <label className="admin-crud-label">Program</label>
              <select
                className="admin-crud-input"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={!departmentId}
              >
                <option value="">Select program…</option>
                {programChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-crud-field">
              <label className="admin-crud-label">Year / level</label>
              <select className="admin-crud-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Select year…</option>
                {options?.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
