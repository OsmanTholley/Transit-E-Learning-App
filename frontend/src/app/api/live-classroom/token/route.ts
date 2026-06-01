import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser, unauthorized } from "@/lib/auth";
import { createLiveKitToken, isLiveKitConfigured } from "@/lib/live-classroom/livekit";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/types/app";

export async function POST(request: NextRequest) {
  try {
    const user = await getValidatedUser(["student", "lecturer", "admin"]);
    if (!user) return unauthorized();

    const body = await request.json();
    const { liveClassId } = body as { liveClassId?: string };
    if (!liveClassId) {
      return NextResponse.json({ error: "liveClassId is required." }, { status: 400 });
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      include: {
        lecturer: { select: { userId: true } },
        course: {
          select: {
            courseStudents: { select: { student: { select: { userId: true } } } },
          },
        },
      },
    });

    if (!liveClass?.roomName) {
      return NextResponse.json({ error: "Live class not found." }, { status: 404 });
    }

    const roleMap: Record<string, AppRole> = {
      STUDENT: "student",
      LECTURER: "lecturer",
      ADMIN: "admin",
    };
    const role = roleMap[user.role];

    if (role === "lecturer" && liveClass.lecturer?.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (role === "student") {
      const enrolled = liveClass.course?.courseStudents.some(
        (cs) => cs.student.userId === user.id
      );
      if (!enrolled) {
        return NextResponse.json({ error: "Not enrolled in this course." }, { status: 403 });
      }
    }

    if (!isLiveKitConfigured()) {
      return NextResponse.json({
        configured: false,
        roomName: liveClass.roomName,
        message: "LiveKit is not configured. Classroom runs in collaboration mode.",
      });
    }

    const token = await createLiveKitToken({
      roomName: liveClass.roomName,
      participantName: user.fullName,
      participantIdentity: user.id,
      role,
    });

    return NextResponse.json({
      configured: true,
      token,
      roomName: liveClass.roomName,
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    });
  } catch (error) {
    console.error("POST live-classroom token:", error);
    return NextResponse.json({ error: "Failed to create token." }, { status: 500 });
  }
}
