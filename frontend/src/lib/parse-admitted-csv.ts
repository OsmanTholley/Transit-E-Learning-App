export type ParsedAdmitRow = {
  studentId: string;
  fullName: string;
  departmentName?: string;
  programName?: string;
  year?: string;
  semester?: string;
  admissionYear?: string;
};

const HEADER_ALIASES: Record<string, keyof ParsedAdmitRow | "ignore"> = {
  student_id: "studentId",
  studentid: "studentId",
  id: "studentId",
  student: "studentId",
  tcsl: "studentId",
  full_name: "fullName",
  fullname: "fullName",
  name: "fullName",
  student_name: "fullName",
  department: "departmentName",
  dept: "departmentName",
  faculty: "departmentName",
  program: "programName",
  programme: "programName",
  course: "programName",
  year: "year",
  level: "year",
  semester: "semester",
  sem: "semester",
  admission_year: "admissionYear",
  admissionyear: "admissionYear",
  year_of_admission: "admissionYear",
};

function normalizeHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Minimal RFC-style CSV row parser (handles quoted fields). */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseAdmittedStudentsCsv(text: string): {
  rows: ParsedAdmitRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["File is empty."] };
  }

  const headerCells = parseCsvLine(lines[0]);
  const columnMap: (keyof ParsedAdmitRow | null)[] = headerCells.map((h) => {
    const key = normalizeHeader(h);
    const mapped = HEADER_ALIASES[key];
    if (!mapped || mapped === "ignore") return null;
    return mapped;
  });

  const hasStudentId = columnMap.includes("studentId");
  const hasFullName = columnMap.includes("fullName");

  if (!hasStudentId || !hasFullName) {
    return {
      rows: [],
      errors: [
        "CSV must include headers for Student ID and Full Name (e.g. student_id, full_name).",
      ],
    };
  }

  const rows: ParsedAdmitRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cells = parseCsvLine(lines[lineIndex]);
    if (cells.every((c) => !c)) continue;

    const record: Partial<ParsedAdmitRow> = {};
    columnMap.forEach((field, colIndex) => {
      if (!field) return;
      const value = cells[colIndex]?.trim();
      if (value) {
        record[field] = value;
      }
    });

    if (!record.studentId?.trim() || !record.fullName?.trim()) {
      errors.push(`Row ${lineIndex + 1}: missing student ID or full name.`);
      continue;
    }

    rows.push({
      studentId: record.studentId.trim(),
      fullName: record.fullName.trim(),
      departmentName: record.departmentName?.trim(),
      programName: record.programName?.trim(),
      year: record.year?.trim(),
      semester: record.semester?.trim(),
      admissionYear: record.admissionYear?.trim(),
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No data rows found below the header.");
  }

  return { rows, errors };
}

export const ADMITTED_STUDENTS_CSV_TEMPLATE = [
  "student_id,full_name,department,program,year,semester,admission_year",
  "TCSL/001,John Kamara,Computing Sciences,BSc Computer Science,Year 1,First,2025",
  "TCSL/002,Mariama Conteh,Public Health,BSc Public Health,Year 2,Second,2024",
].join("\n");
