import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const rows = await prisma.activityLog.findMany({
      where: { action: "youtube.viewed" },
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            fullName: true,
            role: true,
            email: true,
            student: {
              select: {
                studentId: true,
              },
            },
          },
        },
      },
    });

    const logs = rows.map((row) => {
      const meta = row.metadata as Record<string, unknown> | null;
      return {
        id: row.id,
        videoId: (meta?.videoId as string) ?? row.entityId ?? "",
        title: row.summary ?? (meta?.title as string) ?? "Untitled",
        channel: (meta?.channel as string) ?? null,
        thumbnail: (meta?.thumbnail as string) ?? null,
        youtubeUrl: (meta?.youtubeUrl as string) ?? null,
        query: (meta?.query as string) ?? null,
        studentName: row.actor?.fullName ?? "Unknown",
        studentId: row.actor?.student?.studentId ?? null,
        studentEmail: row.actor?.email ?? null,
        viewedAt: row.createdAt.toISOString(),
      };
    });

    // Top videos — aggregate by videoId
    const topMap = new Map<string, { videoId: string; title: string; channel: string | null; thumbnail: string | null; youtubeUrl: string | null; count: number }>();
    for (const log of logs) {
      const existing = topMap.get(log.videoId);
      if (existing) {
        existing.count++;
      } else {
        topMap.set(log.videoId, {
          videoId: log.videoId,
          title: log.title,
          channel: log.channel,
          thumbnail: log.thumbnail,
          youtubeUrl: log.youtubeUrl,
          count: 1,
        });
      }
    }
    const topVideos = Array.from(topMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({ logs, topVideos, total: logs.length });
  } catch (error) {
    console.error("GET /api/admin/youtube-views:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load YouTube views." }, { status: 500 });
  }
}
