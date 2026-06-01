import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  listLecturerLiveClasses,
  scheduleLiveClass,
} from "@/lib/live-classroom/service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const sessions = await listLecturerLiveClasses(lecturer.id);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/lecturer/live-classes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load live classes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = await request.json();
    const { courseId, title, description, startTime, endTime } = body as {
      courseId?: string;
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!courseId?.trim() || !title?.trim() || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Course, title, start time, and end time are required." },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: "Invalid schedule times." }, { status: 400 });
    }

    const session = await scheduleLiveClass({
      lecturerId: lecturer.id,
      courseId: courseId.trim(),
      title: title.trim(),
      description,
      startTime: start,
      endTime: end,
    });

    if (!session) {
      return NextResponse.json({ error: "Course not found or not assigned to you." }, { status: 404 });
    }

    const sessions = await listLecturerLiveClasses(lecturer.id);
    return NextResponse.json({ message: "Live class scheduled.", sessions }, { status: 201 });
  } catch (error) {
    console.error("POST /api/lecturer/live-classes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to schedule live class." }, { status: 500 });
  }
}

/** Course options for scheduling */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
