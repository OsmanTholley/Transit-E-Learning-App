import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getValidatedUser } from "@/lib/auth";
import {
  endLiveClass,
  endLiveClassAsAdmin,
  getLiveClassAccess,
  logLiveClassExit,
  type LiveClassSessionAs,
} from "@/lib/live-class-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const sessionAs: LiveClassSessionAs | undefined =
    body.sessionAs === "student" ? "student" : body.sessionAs === "lecturer" ? "lecturer" : undefined;

  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = await getLiveClassAccess(
    id,
    user.id,
    user.role,
    user.role === Role.ADMIN ? { sessionAs: sessionAs ?? "lecturer" } : undefined,
  );
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (body.action === "end" && access.isLecturer) {
    if (user.role === Role.ADMIN) {
      await endLiveClassAsAdmin(id);
    } else if (access.lecturer) {
      await endLiveClass(id, access.lecturer.id);
    }
    return NextResponse.json({ ok: true, ended: true });
  }

  if (user.role === Role.STUDENT && access.student) {
    await logLiveClassExit(id, access.student.id);
  }

  return NextResponse.json({ ok: true });
}
