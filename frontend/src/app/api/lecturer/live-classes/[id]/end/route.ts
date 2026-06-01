import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { endLiveClass, listLecturerLiveClasses } from "@/lib/live-classroom/service";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const recordingUrl = (body as { recordingUrl?: string }).recordingUrl?.trim();

    if (recordingUrl) {
      await prisma.liveClass.update({
        where: { id },
        data: { recordingUrl },
      });
      await prisma.liveClassRecording.create({
        data: {
          liveClassId: id,
          title: "Class recording",
          recordingUrl,
        },
      });
    }

    const session = await endLiveClass(id, lecturer.id);
    if (!session) {
      return NextResponse.json({ error: "Live class not found." }, { status: 404 });
    }

    const sessions = await listLecturerLiveClasses(lecturer.id);
    return NextResponse.json({ message: "Class ended. Attendance finalized.", sessions });
  } catch (error) {
    console.error("POST end live class:", error);
    return NextResponse.json({ error: "Failed to end class." }, { status: 500 });
  }
}
