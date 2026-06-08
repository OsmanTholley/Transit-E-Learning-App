"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { requestApi } from "@/lib/fetch-api";
import { showConfirm, showError, showSuccess } from "@/lib/swal";
import type { CourseRecord, ProgramRecord } from "@/types/academic";
import type { DepartmentRecord } from "@/types/department";

type EntityKind = "department" | "program" | "course";

const entityMeta: Record<
  EntityKind,
  { kicker: string; label: string; badgeClass: string }
> = {
  department: {
    kicker: "Academic structure",
    label: "Department",
    badgeClass: "admin-crud-entity-badge--department",
  },
  program: {
    kicker: "Degree pathway",
    label: "Program",
    badgeClass: "admin-crud-entity-badge--program",
  },
  course: {
    kicker: "Course catalog",
    label: "Course",
    badgeClass: "admin-crud-entity-badge--course",
  },
};

function IconPlus() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconView() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 3c-3.5 0-6.5 2.2-8 5.5 1.5 3.3 4.5 5.5 8 5.5s6.5-2.2 8-5.5C16.5 5.2 13.5 3 10 3Zm0 9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-9.5 9.5a1 1 0 0 1-.434.242l-3.5 1a1 1 0 0 1-1.213-1.213l1-3.5a1 1 0 0 1 .242-.434l9.5-9.5Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8.5 2A1.5 1.5 0 0 0 7 3.5V4H4a1 1 0 1 0 0 2h.05l.737 9.838A2 2 0 0 0 6.776 18h6.448a2 2 0 0 0 1.994-2.162L15.95 6H16a1 1 0 1 0 0-2h-3v-.5A1.5 1.5 0 0 0 11.5 2h-3Zm-1 2h3V4h-3v.001ZM7.05 6l.715 9.548a.5.5 0 0 0 .498.452h6.474a.5.5 0 0 0 .498-.452L16.95 6H7.05Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
      <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AdminCrudPageHero({
  entity,
  title,
  description,
  addHref,
  addLabel,
}: {
  entity: EntityKind;
  title: string;
  description: string;
  addHref: string;
  addLabel: string;
}) {
  const meta = entityMeta[entity];

  return (
    <section className="admin-crud-hero">
      <div className="admin-crud-hero-inner">
        <div>
          <p className="admin-crud-hero-kicker">{meta.kicker}</p>
          <h1 className="admin-crud-hero-title">{title}</h1>
          <p className="admin-crud-hero-desc">{description}</p>
        </div>
        <div className="admin-crud-hero-actions">
          <Link href={addHref} className="admin-crud-add-btn">
            <IconPlus />
            {addLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AdminCrudSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="admin-crud-search-wrap">
      <IconSearch />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="admin-crud-search"
      />
    </div>
  );
}

export function AdminEntityBadge({ entity }: { entity: EntityKind }) {
  const meta = entityMeta[entity];
  return <span className={`admin-crud-entity-badge ${meta.badgeClass}`}>{meta.label}</span>;
}

type ModalShellProps = {
  entity: EntityKind;
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
  footer: ReactNode;
};

function ModalShell({ entity, title, subtitle, onClose, wide, children, footer }: ModalShellProps) {
  const meta = entityMeta[entity];

  return (
    <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-crud-modal-title">
      <div className={`admin-crud-modal${wide ? " admin-crud-modal--wide" : ""}`}>
        <div className={`admin-crud-modal-header admin-crud-modal-header--${entity}`}>
          <div className="admin-crud-modal-header-glow" />
          <div className="admin-crud-modal-header-top">
            <div>
              <p className="admin-crud-modal-kicker">{meta.kicker}</p>
              <h3 id="admin-crud-modal-title" className="admin-crud-modal-title">
                {title}
              </h3>
              {subtitle ? <p className="admin-crud-modal-subtitle">{subtitle}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="admin-crud-modal-close" aria-label="Close">
              <IconClose />
            </button>
          </div>
        </div>
        <div className="admin-crud-modal-body">{children}</div>
        <div className="admin-crud-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function CrudField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-crud-field">
      <label className="admin-crud-label">{label}</label>
      {children}
    </div>
  );
}

export function DepartmentEditModal({
  department,
  onClose,
  onSaved,
}: {
  department: DepartmentRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(department.name);
  const [description, setDescription] = useState(department.description);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      await showError("Missing name", "Department name is required.");
      return;
    }
    setSubmitting(true);
    const result = await requestApi<{ message?: string }>(`/api/departments/${department.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentName: name.trim(), description: description.trim() }),
      errorTitle: "Could not update department",
    });
    setSubmitting(false);
    if (!result.ok) return;
    await showSuccess("Updated", result.data.message ?? "Department saved.");
    onSaved();
    onClose();
  }

  return (
    <ModalShell
      entity="department"
      title="Edit department"
      subtitle={department.code}
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="department-edit-form" disabled={submitting} className="admin-crud-btn-primary">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose} className="admin-crud-btn-secondary">
            Cancel
          </button>
        </>
      }
    >
      <form id="department-edit-form" onSubmit={handleSubmit}>
        <CrudField label="Department name">
          <input
            className="admin-crud-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </CrudField>
        <CrudField label="Description">
          <textarea
            className="admin-crud-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CrudField>
      </form>
    </ModalShell>
  );
}

export function ProgramEditModal({
  program,
  onClose,
  onSaved,
}: {
  program: ProgramRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(program.name);
  const [duration, setDuration] = useState(program.duration === "—" ? "" : program.duration);
  const [departmentId, setDepartmentId] = useState(program.departmentId ?? "");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void requestApi<{ departments: { id: string; name: string }[] }>("/api/programs/options", {
      silent: true,
    }).then((result) => {
      if (result.ok) setDepartments(result.data.departments ?? []);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      await showError("Missing name", "Program name is required.");
      return;
    }
    setSubmitting(true);
    const result = await requestApi<{ message?: string }>(`/api/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programName: name.trim(),
        duration: duration.trim() || null,
        ...(departmentId ? { departmentId } : {}),
      }),
      errorTitle: "Could not update program",
    });
    setSubmitting(false);
    if (!result.ok) return;
    await showSuccess("Updated", result.data.message ?? "Program saved.");
    onSaved();
    onClose();
  }

  return (
    <ModalShell
      entity="program"
      title="Edit program"
      subtitle={program.department}
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="program-edit-form" disabled={submitting} className="admin-crud-btn-primary">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose} className="admin-crud-btn-secondary">
            Cancel
          </button>
        </>
      }
    >
      <form id="program-edit-form" onSubmit={handleSubmit}>
        <CrudField label="Program name">
          <input
            className="admin-crud-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </CrudField>
        <CrudField label="Department">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="admin-crud-select"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </CrudField>
        <CrudField label="Duration">
          <input
            className="admin-crud-input"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 4 years"
          />
        </CrudField>
      </form>
    </ModalShell>
  );
}

export function CourseEditModal({
  course,
  onClose,
  onSaved,
}: {
  course: CourseRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [level, setLevel] = useState(course.level === "—" ? "" : course.level);
  const [semester, setSemester] = useState(course.semester === "—" ? "" : course.semester);
  const [description, setDescription] = useState(course.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      await showError("Missing fields", "Course code and title are required.");
      return;
    }
    setSubmitting(true);
    const result = await requestApi<{ message?: string }>(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode: code.trim(),
        courseTitle: title.trim(),
        level: level.trim() || null,
        semester: semester.trim() || null,
        description: description.trim() || null,
      }),
      errorTitle: "Could not update course",
    });
    setSubmitting(false);
    if (!result.ok) return;
    await showSuccess("Updated", result.data.message ?? "Course saved.");
    onSaved();
    onClose();
  }

  return (
    <ModalShell
      entity="course"
      title="Edit course"
      subtitle={`${course.code} · ${course.department}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="submit" form="course-edit-form" disabled={submitting} className="admin-crud-btn-primary">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose} className="admin-crud-btn-secondary">
            Cancel
          </button>
        </>
      }
    >
      <form id="course-edit-form" onSubmit={handleSubmit}>
        <div className="admin-crud-field-grid admin-crud-field-grid--2">
          <CrudField label="Course code">
            <input
              className="admin-crud-input font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </CrudField>
          <CrudField label="Course title">
            <input
              className="admin-crud-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </CrudField>
        </div>
        <div className="admin-crud-field-grid admin-crud-field-grid--2">
          <CrudField label="Year">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="admin-crud-select">
              <option value="">Select year</option>
              {ACADEMIC_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </CrudField>
          <CrudField label="Semester">
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="admin-crud-select">
              <option value="">Select semester</option>
              <option value="First">First</option>
              <option value="Second">Second</option>
            </select>
          </CrudField>
        </div>
        <CrudField label="Description">
          <textarea
            className="admin-crud-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CrudField>
      </form>
    </ModalShell>
  );
}

export function AdminRowActions({
  onEdit,
  onDelete,
  viewHref,
  onView,
}: {
  onEdit: () => void;
  onDelete: () => void;
  viewHref?: string;
  onView?: () => void;
}) {
  return (
    <div className="admin-crud-actions">
      {viewHref ? (
        <Link
          href={viewHref}
          className="admin-crud-action-btn admin-crud-action-btn--view"
          title="View"
          aria-label="View"
        >
          <IconView />
        </Link>
      ) : onView ? (
        <button
          type="button"
          onClick={onView}
          className="admin-crud-action-btn admin-crud-action-btn--view"
          title="View"
          aria-label="View"
        >
          <IconView />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        className="admin-crud-action-btn admin-crud-action-btn--edit"
        title="Edit"
        aria-label="Edit"
      >
        <IconEdit />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="admin-crud-action-btn admin-crud-action-btn--delete"
        title="Delete"
        aria-label="Delete"
      >
        <IconTrash />
      </button>
    </div>
  );
}

export async function confirmAndDelete(
  apiPath: string,
  confirmMessage: string,
  onDeleted: () => void
) {
  const ok = await showConfirm("Delete this item?", confirmMessage);
  if (!ok) return;

  const result = await requestApi<{ message?: string }>(apiPath, {
    method: "DELETE",
    errorTitle: "Could not delete",
  });
  if (!result.ok) return;
  await showSuccess("Deleted", result.data.message ?? "Item removed.");
  onDeleted();
}
