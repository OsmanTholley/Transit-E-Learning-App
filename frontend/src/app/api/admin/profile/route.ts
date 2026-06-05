import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { loadAdminProfile, patchUserProfileFields } from "@/lib/user-profile-service";

export async function GET() {
  try {
    const user = await requireAdminUser();
    if (!user) return unauthorized();

    const profile = await loadAdminProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Admin profile not found." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/admin/profile:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdminUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { fullName, phone, bio, socialLinks, profileImage } = body;

    if (fullName !== undefined && !fullName?.trim()) {
      return NextResponse.json({ error: "Full name cannot be empty." }, { status: 400 });
    }

    await patchUserProfileFields(user.id, {
      fullName,
      phone,
      bio,
      socialLinks,
      profileImage,
    });

    const profile = await loadAdminProfile(user.id);
    return NextResponse.json({
      message: "Profile updated successfully.",
      ...profile,
    });
  } catch (error) {
    console.error("PATCH /api/admin/profile:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
