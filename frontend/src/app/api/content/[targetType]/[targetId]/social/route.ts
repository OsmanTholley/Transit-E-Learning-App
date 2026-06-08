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
import { createHash } from "crypto";

function getUuidFromYoutubeId(youtubeId: string): string {
  const hash = createHash("md5").update(youtubeId).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

type Params = { params: Promise<{ targetType: string; targetId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { targetType: slug, targetId } = await params;
    const targetType = parseSocialTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const user = await getValidatedUser(["student", "lecturer", "admin"]);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    let dbTargetId = targetId;

    if (targetType === "VIDEO" && !isUuid) {
      dbTargetId = getUuidFromYoutubeId(targetId);
    } else {
      const exists = await assertContentTargetExists(targetType, targetId);
      if (!exists) {
        return NextResponse.json({ error: "Content not found." }, { status: 404 });
      }
    }

    const engagement = await getContentEngagement(targetType, dbTargetId, user?.id ?? null);
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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    let dbTargetId = targetId;

    if (targetType === "VIDEO" && !isUuid) {
      dbTargetId = getUuidFromYoutubeId(targetId);
    } else {
      const exists = await assertContentTargetExists(targetType, targetId);
      if (!exists) {
        return NextResponse.json({ error: "Content not found." }, { status: 404 });
      }
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "comment") {
      const text = body.body?.trim();
      if (!text) {
        return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
      }
      const comment = await addContentComment(targetType, dbTargetId, user.id, text);
      const engagement = await getContentEngagement(targetType, dbTargetId, user.id);
      return NextResponse.json({ comment, ...engagement });
    }

    if (action === "like") {
      const like = await toggleContentLike(targetType, dbTargetId, user.id);
      const engagement = await getContentEngagement(targetType, dbTargetId, user.id);
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
