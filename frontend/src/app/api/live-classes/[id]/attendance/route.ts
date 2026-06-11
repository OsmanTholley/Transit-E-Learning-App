import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getValidatedUser } from "@/lib/auth";
import {
  buildAttendanceCsv,
  buildAttendanceReportHtml,
  getLiveClassAttendanceDashboard,
} from "@/lib/live-class-attendance-service";
import { getLiveClassAccess } from "@/lib/live-class-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getValidatedUser(["lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = await getLiveClassAccess(id, user.id, user.role as Role);
  if (!access.ok || !access.isModerator) {
    return NextResponse.json({ error: "Only the session host can view attendance." }, { status: 403 });
  }

  const dashboard = await getLiveClassAttendanceDashboard(id);
  if (!dashboard) {
    return NextResponse.json({ error: "Live class not found." }, { status: 404 });
  }

  const exportType = request.nextUrl.searchParams.get("export");
  if (exportType === "pdf") {
    const html = buildAttendanceReportHtml(dashboard);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="attendance-${id}.html"`,
      },
    });
  }

  if (exportType === "csv") {
    const csv = buildAttendanceCsv(dashboard);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${id}.csv"`,
      },
    });
  }

  return NextResponse.json(dashboard);
}
