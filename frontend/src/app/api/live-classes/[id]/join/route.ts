import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";
import {
  getLiveClassAccess,
  JITSI_DOMAIN,
  logLiveClassJoin,
} from "@/lib/live-class-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = await getLiveClassAccess(id, user.id, user.role);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { liveClass } = access;

  if (!liveClass.roomName) {
    return NextResponse.json({ error: "Live class not found." }, { status: 404 });
  }

  if (access.isLecturer) {
    return NextResponse.json({
      ok: true,
      roomName: liveClass.roomName,
      jitsiDomain: JITSI_DOMAIN,
      displayName: access.displayName,
      isModerator: true,
      sessionAs: user.role === Role.ADMIN ? "observer" : "lecturer",
      liveClass: {
        id: liveClass.id,
        title: liveClass.title,
        status: liveClass.status,
        course: liveClass.course,
      },
    });
  }

  if (user.role === Role.STUDENT && access.student) {
    const student = access.student;

    await logLiveClassJoin({
      liveClassId: liveClass.id,
      studentId: student.id,
      studentIdCode: student.studentId,
      studentName: access.displayName ?? student.user.fullName,
      courseCode: liveClass.course?.courseCode ?? "",
      courseTitle: liveClass.course?.courseTitle ?? "",
    });
  }

  return NextResponse.json({
    ok: true,
    roomName: liveClass.roomName,
    jitsiDomain: JITSI_DOMAIN,
    displayName: access.displayName,
    isModerator: false,
    sessionAs: "student",
    liveClass: {
      id: liveClass.id,
      title: liveClass.title,
      status: liveClass.status,
      course: liveClass.course,
    },
  });
}
