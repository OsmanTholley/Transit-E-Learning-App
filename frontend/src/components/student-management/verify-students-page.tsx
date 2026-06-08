"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminRowActions, AdminCrudSearch, confirmAndDelete } from "@/components/admin/admin-entity-crud";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { ADMITTED_STUDENTS_CSV_TEMPLATE } from "@/lib/parse-admitted-csv";
import { showError, showSuccess } from "@/lib/swal";
import { AdmittedEditModal } from "./admitted-edit-modal";
import { StudentCrudPageHero } from "./student-crud-hero";
import { Panel, PrimaryButton, SecondaryButton, StatusBadge, StudentSection } from "./ui";

type AdmittedRow = {
  id: string;
  studentId: string;
  fullName: string;
  department: string;
  program: string;
  status: string;
  registeredAt: string | null;
  createdAt: string;
};

type ImportSummary = {
  imported: number;
  skipped: number;
  failed: number;
};

export function VerifyStudentsPage() {
  const [admitted, setAdmitted] = useState<AdmittedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "registered">("all");
  const [editing, setEditing] = useState<AdmittedRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAdmitted = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students/admitted", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load admitted students");
      setAdmitted(data.admitted);
    } catch (err) {
      await showError("Load failed", err instanceof Error ? err.message : "Could not load registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/students/admitted", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Failed to load admitted students");
        setAdmitted(data.admitted);
      } catch (err) {
        if (!cancelled) {
          await showError("Load failed", err instanceof Error ? err.message : "Could not load registry.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = admitted.filter((row) => {
    if (statusFilter === "pending" && row.status !== "Pending") return false;
    if (statusFilter === "registered" && row.status !== "Registered") return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [row.studentId, row.fullName, row.department, row.program].join(" ").toLowerCase().includes(q);
  });

  const pendingCount = admitted.filter((r) => r.status === "Pending").length;
  const registeredCount = admitted.filter((r) => r.status === "Registered").length;

  function downloadTemplate() {
    const blob = new Blob([ADMITTED_STUDENTS_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admitted-students-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadFile(file: File) {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
      await showError(
        "Invalid file",
        "Please upload a CSV file (.csv). In Excel, choose File → Save As → CSV UTF-8.",
      );
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("skipDuplicates", "true");

      const res = await fetch("/api/students/admitted/import", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        const detail =
          Array.isArray(data.parseErrors) && data.parseErrors.length > 0
            ? `${data.error}\n\n${data.parseErrors.slice(0, 5).join("\n")}`
            : data.error;
        throw new Error(detail ?? "Import failed");
      }

      const summary: ImportSummary = {
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        failed: data.failed ?? 0,
      };

      let detail = `${data.imported} imported, ${data.skipped} skipped`;
      if (summary.failed > 0) detail += `, ${summary.failed} failed`;
      if (Array.isArray(data.parseErrors) && data.parseErrors.length > 0) {
        detail += `\n\nParse notes:\n${data.parseErrors.slice(0, 3).join("\n")}`;
      }
      const failedRows = (data.results as { status: string; studentId: string; message?: string }[] | undefined)?.filter(
        (r) => r.status === "error",
      );
      if (failedRows && failedRows.length > 0) {
        detail += `\n\n${failedRows
          .slice(0, 5)
          .map((r) => `${r.studentId}: ${r.message}`)
          .join("\n")}`;
      }

      await showSuccess("Import complete", detail);
      await loadAdmitted();
    } catch (err) {
      await showError("Import failed", err instanceof Error ? err.message : "Could not import file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <StudentSection>
      <StudentCrudPageHero section="verify" />

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-yellow-500">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admitted registry</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{admitted.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting registration</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{registeredCount}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Verification flow">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Upload a CSV of admitted student IDs (or add one student under Add Student).</li>
            <li>Student enters their TCSL/ ID at the registration page.</li>
            <li>System checks this admitted registry — if found, they set their password.</li>
            <li>Status changes to Registered once they complete sign-up.</li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            Department and program names in the CSV must match records in your database (from seed or Admin →
            Departments).
          </p>
        </Panel>

        <Panel
          title="Upload admitted IDs"
          action={
            <SecondaryButton type="button" onClick={downloadTemplate}>
              Download template
            </SecondaryButton>
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={onFileInputChange}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={[
              "rounded-xl border-2 border-dashed p-8 text-center transition",
              dragOver ? "border-yellow-400 bg-yellow-50/50" : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-slate-700">
              {uploading ? "Importing…" : "Drop CSV file here"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Columns: student_id, full_name, department, program, year, semester, admission_year
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <PrimaryButton
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Browse CSV"}
              </PrimaryButton>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Excel: save workbook as CSV UTF-8 (.csv) before uploading.
            </p>
          </div>
        </Panel>
      </div>

      <AdminTableShell
        title="Admitted students registry"
        count={filtered.length}
        countLabel="students"
        variant="detailed"
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <AdminCrudSearch value={search} onChange={setSearch} placeholder="ID, name, department…" />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", `All (${admitted.length})`],
                  ["pending", `Pending (${pendingCount})`],
                  ["registered", `Registered (${registeredCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-semibold",
                    statusFilter === key ? "bg-yellow-500 text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
              <Link
                href="/admin/students/add"
                className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-400"
              >
                Add one
              </Link>
            </div>
          </div>
        }
      >
        {loading ? (
          <LoadingState message="Loading admitted students…" layout="compact" className="p-6" />
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {admitted.length === 0
              ? "No admitted students yet. Upload a CSV or add a student manually."
              : "No students match your filters."}
          </p>
        ) : (
          <table className="admin-crud-table">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {["Student ID", "Name", "Department", "Program", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 sm:px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="admin-crud-table-row bg-white hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-mono text-xs font-semibold text-yellow-800 sm:px-4">
                    {row.studentId}
                  </td>
                  <td className="px-3 py-3 sm:px-4">{row.fullName}</td>
                  <td className="px-3 py-3 text-slate-600 sm:px-4">{row.department}</td>
                  <td className="px-3 py-3 text-slate-600 sm:px-4">{row.program}</td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={row.status === "Registered" ? "Registered" : "Pending"} />
                  </td>
                  <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                    {row.status === "Pending" ? (
                      <AdminRowActions
                        onEdit={() => setEditing(row)}
                        onDelete={() =>
                          void confirmAndDelete(
                            `/api/students/admitted/${row.id}`,
                            "This student will be removed from the admitted registry.",
                            () => void loadAdmitted(),
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Registered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableShell>

      {editing ? (
        <AdmittedEditModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void loadAdmitted()}
        />
      ) : null}
    </StudentSection>
  );
}
