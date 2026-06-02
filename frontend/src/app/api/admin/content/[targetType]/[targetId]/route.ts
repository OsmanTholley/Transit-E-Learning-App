import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { parseSocialTarget } from "@/lib/content-social";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ targetType: string; targetId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { targetType: slug, targetId } = await params;
    const targetType = parseSocialTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    if (targetType === "LECTURE_NOTE") {
      await prisma.contentComment.deleteMany({
        where: { targetType, targetId },
      });
      await prisma.contentLike.deleteMany({ where: { targetType, targetId } });
      await prisma.lectureNote.delete({ where: { id: targetId } });
      return NextResponse.json({ message: "Material deleted." });
    }

    await prisma.contentComment.deleteMany({ where: { targetType, targetId } });
    await prisma.contentLike.deleteMany({ where: { targetType, targetId } });
    await prisma.video.delete({ where: { id: targetId } });

    return NextResponse.json({ message: "Video deleted." });
  } catch (error) {
    console.error("DELETE admin content:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete content." }, { status: 500 });
  }
}
