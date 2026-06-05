import { NextRequest, NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { loadStudentProfile, patchUserProfileFields } from "@/lib/user-profile-service";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const profile = await loadStudentProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/student/profile:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const body = await request.json();
    const { fullName, phone, bio, socialLinks, learningGoals, achievements, profileImage } = body;

    if (fullName !== undefined && !fullName?.trim()) {
      return NextResponse.json({ error: "Full name cannot be empty." }, { status: 400 });
    }

    await patchUserProfileFields(user.id, {
      fullName,
      phone,
      bio,
      socialLinks,
      learningGoals,
      achievements,
      profileImage,
    });

    if (profileImage !== undefined) {
      await prisma.student.update({
        where: { userId: user.id },
        data: { profileImage: profileImage || null },
      });
    }

    const profile = await loadStudentProfile(user.id);
    return NextResponse.json({
      message: "Profile updated successfully.",
      ...profile,
    });
  } catch (error) {
    console.error("PATCH /api/student/profile:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
