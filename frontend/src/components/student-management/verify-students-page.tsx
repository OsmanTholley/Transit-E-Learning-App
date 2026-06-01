"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ADMITTED_STUDENTS_CSV_TEMPLATE } from "@/lib/parse-admitted-csv";
import { showError, showSuccess } from "@/lib/swal";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, StatusBadge, StudentSection } from "./ui";

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

  async function removeAdmitted(row: AdmittedRow) {
    if (row.status === "Registered") {
      await showError("Cannot remove", "This student has already completed registration.");
      return;
    }

    const res = await fetch(`/api/students/admitted/${row.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      await showError("Remove failed", data.error ?? "Could not remove student.");
      return;
    }
    await showSuccess("Removed", data.message);
    await loadAdmitted();
  }

  return (
    <StudentSection>
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-emerald-600">
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
              dragOver ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 bg-slate-50",
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

      <Panel
        title="Admitted students registry"
        noPadding
        action={
          <Link
            href="/admin/students/add"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Add one student
          </Link>
        }
      >
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1 max-w-md">
              <FieldLabel>Search</FieldLabel>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ID, name, department…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
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
                    statusFilter === key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading admitted students…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {admitted.length === 0
              ? "No admitted students yet. Upload a CSV or add a student manually."
              : "No students match your filters."}
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full text-sm">
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
                  <tr key={row.id} className="bg-white hover:bg-slate-50/80">
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-emerald-800 sm:px-4">
                      {row.studentId}
                    </td>
                    <td className="px-3 py-3 sm:px-4">{row.fullName}</td>
                    <td className="px-3 py-3 text-slate-600 sm:px-4">{row.department}</td>
                    <td className="px-3 py-3 text-slate-600 sm:px-4">{row.program}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <StatusBadge status={row.status === "Registered" ? "Registered" : "Pending"} />
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      {row.status === "Pending" ? (
                        <button
                          type="button"
                          onClick={() => removeAdmitted(row)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </StudentSection>
  );
}
