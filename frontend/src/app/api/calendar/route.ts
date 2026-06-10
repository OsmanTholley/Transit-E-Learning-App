import { NextRequest, NextResponse } from "next/server";
import { listCalendarEvents, roleFromUserRole } from "@/lib/academic-calendar-service";
import { getValidatedUser } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getValidatedUser(["student", "lecturer", "admin"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = roleFromUserRole(user.role);
    if (!role) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get("month");
    const from = month ? new Date(`${month}-01T00:00:00`) : undefined;
    const to = from ? new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59) : undefined;

    const events = await listCalendarEvents({ role, from, to, limit: 200 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/calendar:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load calendar." }, { status: 500 });
  }
}
