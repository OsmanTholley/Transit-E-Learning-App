import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import {
  addContentComment,
  assertContentTargetExists,
  getContentEngagement,
  parseSocialTarget,
  toggleContentLike,
} from "@/lib/content-social";

type Params = { params: Promise<{ targetType: string; targetId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { targetType: slug, targetId } = await params;
    const targetType = parseSocialTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const user = await getValidatedUser(["student", "lecturer", "admin"]);
    const exists = await assertContentTargetExists(targetType, targetId);
    if (!exists) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    const engagement = await getContentEngagement(targetType, targetId, user?.id ?? null);
    return NextResponse.json(engagement);
  } catch (error) {
    console.error("GET content social:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load engagement." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getValidatedUser(["student", "lecturer", "admin"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { targetType: slug, targetId } = await params;
    const targetType = parseSocialTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const exists = await assertContentTargetExists(targetType, targetId);
    if (!exists) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "comment") {
      const text = body.body?.trim();
      if (!text) {
        return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
      }
      const comment = await addContentComment(targetType, targetId, user.id, text);
      const engagement = await getContentEngagement(targetType, targetId, user.id);
      return NextResponse.json({ comment, ...engagement });
    }

    if (action === "like") {
      const like = await toggleContentLike(targetType, targetId, user.id);
      const engagement = await getContentEngagement(targetType, targetId, user.id);
      return NextResponse.json({ ...like, ...engagement });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("POST content social:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update engagement." }, { status: 500 });
  }
}
