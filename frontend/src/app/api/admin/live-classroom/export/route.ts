import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { formatAttendanceStatus } from "@/lib/live-classroom/attendance";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const format = request.nextUrl.searchParams.get("format") ?? "csv";
    const logs = await prisma.liveClassAttendanceLog.findMany({
      orderBy: { joinTime: "desc" },
      take: 5000,
    });

    const headers = [
      "Student ID",
      "Student Name",
      "Course",
      "Join Time",
      "Exit Time",
      "Duration (sec)",
      "Attendance %",
      "Status",
    ];

    const rows = logs.map((log) => [
      log.studentIdCode,
      log.studentName,
      `${log.courseCode} – ${log.courseTitle}`,
      log.joinTime.toISOString(),
      log.exitTime?.toISOString() ?? "",
      String(log.durationSeconds),
      String(Math.round(log.attendancePercent)),
      formatAttendanceStatus(log.status),
    ]);

    if (format === "json") {
      return NextResponse.json({
        exportedAt: new Date().toISOString(),
        records: rows.map((r) => ({
          studentId: r[0],
          studentName: r[1],
          course: r[2],
          joinTime: r[3],
          exitTime: r[4] || null,
          durationSeconds: Number(r[5]),
          attendancePercent: Number(r[6]),
          status: r[7],
        })),
      });
    }

    if (format === "pdf") {
      const tableRows = rows
        .map(
          (r) =>
            `<tr>${r.map((cell) => `<td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px">${escapeCsv(cell).replace(/^"|"$/g, "")}</td>`).join("")}</tr>`
        )
        .join("");
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Live Class Attendance</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:16px}th{background:#0B3D91;color:#fff;padding:8px;text-align:left;font-size:11px}</style>
</head><body>
<h1>Transit E-Learning — Live Classroom Attendance Report</h1>
<p>Generated ${new Date().toLocaleString()}</p>
<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="live-class-attendance-${Date.now()}.html"`,
        },
      });
    }

    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="live-class-attendance-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET export:", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
