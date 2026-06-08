import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  getStudentPreferences,
  setStudentPreference,
  setStudentPreferences,
} from "@/lib/student-preferences";

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const keysParam = request.nextUrl.searchParams.get("keys");
    const keys = keysParam
      ? (keysParam.split(",").map((k) => k.trim()).filter(Boolean) as Parameters<
          typeof getStudentPreferences
        >[1])
      : undefined;

    const preferences = await getStudentPreferences(student.id, keys);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("GET /api/student/preferences:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load preferences." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const body = await request.json();

    if (body.preferences && typeof body.preferences === "object") {
      await setStudentPreferences(student.id, body.preferences as Record<string, unknown>);
      return NextResponse.json({ message: "Preferences saved." });
    }

    const { key, value } = body;
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Preference key is required." }, { status: 400 });
    }

    await setStudentPreference(student.id, key, value);
    return NextResponse.json({ message: "Preference saved." });
  } catch (error) {
    console.error("PUT /api/student/preferences:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to save preference." }, { status: 500 });
  }
}
