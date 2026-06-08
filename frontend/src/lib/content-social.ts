import type { ContentTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SocialTargetSlug = "lecture-note" | "video";

const SLUG_TO_TYPE: Record<SocialTargetSlug, ContentTargetType> = {
  "lecture-note": "LECTURE_NOTE",
  video: "VIDEO",
};

export function parseSocialTarget(slug: string): ContentTargetType | null {
  return SLUG_TO_TYPE[slug as SocialTargetSlug] ?? null;
}

export async function assertContentTargetExists(
  targetType: ContentTargetType,
  targetId: string
) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
  if (targetType === "LECTURE_NOTE") {
    if (!isUuid) return null;
    const note = await prisma.lectureNote.findUnique({ where: { id: targetId } });
    if (!note) return null;
    return { courseId: note.courseId };
  }
  
  if (!isUuid) {
    // YouTube video ID
    return { courseId: "youtube" };
  }
  const video = await prisma.video.findUnique({ where: { id: targetId } });
  if (!video) return null;
  return { courseId: video.courseId };
}

export async function getContentEngagement(
  targetType: ContentTargetType,
  targetId: string,
  viewerUserId: string | null
) {
  const [comments, likeCount, likedByMe] = await Promise.all([
    prisma.contentComment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: { select: { fullName: true, role: true } },
      },
    }),
    prisma.contentLike.count({ where: { targetType, targetId } }),
    viewerUserId
      ? prisma.contentLike.findFirst({
          where: { targetType, targetId, userId: viewerUserId },
        })
      : Promise.resolve(null),
  ]);

  return {
    likeCount,
    likedByMe: Boolean(likedByMe),
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.user.fullName,
      authorRole: c.user.role,
      createdAt: c.createdAt.toISOString(),
    })),
    pinnedComment: (() => {
      const lecturerComments = comments.filter((c) => c.user.role === "LECTURER");
      if (lecturerComments.length === 0) return null;
      const latest = lecturerComments.reduce((a, b) =>
        a.createdAt > b.createdAt ? a : b
      );
      return {
        id: latest.id,
        body: latest.body,
        authorName: latest.user.fullName,
        authorRole: latest.user.role,
        createdAt: latest.createdAt.toISOString(),
      };
    })(),
  };
}

export async function addContentComment(
  targetType: ContentTargetType,
  targetId: string,
  userId: string,
  body: string
) {
  const comment = await prisma.contentComment.create({
    data: { targetType, targetId, userId, body },
    include: { user: { select: { fullName: true, role: true } } },
  });
  return {
    id: comment.id,
    body: comment.body,
    authorName: comment.user.fullName,
    authorRole: comment.user.role,
    createdAt: comment.createdAt.toISOString(),
  };
}

export async function toggleContentLike(
  targetType: ContentTargetType,
  targetId: string,
  userId: string
) {
  const existing = await prisma.contentLike.findFirst({
    where: { targetType, targetId, userId },
  });
  if (existing) {
    await prisma.contentLike.delete({ where: { id: existing.id } });
    const likeCount = await prisma.contentLike.count({ where: { targetType, targetId } });
    return { liked: false, likeCount };
  }
  await prisma.contentLike.create({ data: { targetType, targetId, userId } });
  const likeCount = await prisma.contentLike.count({ where: { targetType, targetId } });
  return { liked: true, likeCount };
}
