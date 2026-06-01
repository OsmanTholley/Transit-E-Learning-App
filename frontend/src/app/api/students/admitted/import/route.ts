import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { importAdmittedStudents } from "@/lib/admitted-student-import";
import { parseAdmittedStudentsCsv } from "@/lib/parse-admitted-csv";
import type { ParsedAdmitRow } from "@/lib/parse-admitted-csv";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const contentType = request.headers.get("content-type") ?? "";

    let rows: ParsedAdmitRow[] = [];
    let skipDuplicates = true;
    const parseErrors: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      skipDuplicates = form.get("skipDuplicates") !== "false";

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }

      const name = file.name.toLowerCase();
      if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
        return NextResponse.json(
          { error: "Upload a CSV file (.csv). For Excel, use Save As → CSV." },
          { status: 400 },
        );
      }

      const text = await file.text();
      const parsed = parseAdmittedStudentsCsv(text);
      rows = parsed.rows;
      parseErrors.push(...parsed.errors);
    } else {
      const body = await request.json();
      if (Array.isArray(body.rows)) {
        rows = body.rows;
      } else if (typeof body.csv === "string") {
        const parsed = parseAdmittedStudentsCsv(body.csv);
        rows = parsed.rows;
        parseErrors.push(...parsed.errors);
      } else {
        return NextResponse.json({ error: "Provide rows[] or csv text." }, { status: 400 });
      }
      skipDuplicates = body.skipDuplicates !== false;
    }

    if (parseErrors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: parseErrors[0], parseErrors }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows to import." }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: "Maximum 500 students per upload." }, { status: 400 });
    }

    const result = await importAdmittedStudents(rows, { skipDuplicates });
    const failed = result.results.filter((r) => r.status === "error");

    return NextResponse.json({
      message: `Imported ${result.imported} student${result.imported === 1 ? "" : "s"}, skipped ${result.skipped}.`,
      imported: result.imported,
      skipped: result.skipped,
      failed: failed.length,
      parseErrors,
      results: result.results,
    });
  } catch (error) {
    console.error("POST /api/students/admitted/import:", error);
    return NextResponse.json({ error: "Failed to import admitted students." }, { status: 500 });
  }
}
