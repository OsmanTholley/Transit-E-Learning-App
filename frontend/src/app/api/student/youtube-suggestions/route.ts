import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

export async function GET(request: NextRequest) {
  const student = await requireStudent();
  if (!student) return unauthorized();

  const locked = await buildFeeLockResponse(student.id, "videos");
  if (locked) return locked;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ videos: [] });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Graceful fallback — the feature is simply not available without a key
    return NextResponse.json({ videos: [], unavailable: true });
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: `${q} lecture tutorial`,
      type: "video",
      videoEmbeddable: "true",
      maxResults: "8",
      safeSearch: "strict",
      relevanceLanguage: "en",
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      { next: { revalidate: 3600 } } // cache per-query for 1 hour
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("YouTube API error:", err);
      return NextResponse.json({ videos: [], error: "YouTube API request failed." });
    }

    const data = await res.json();

    type YouTubeItem = {
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        channelTitle: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
        publishedAt: string;
      };
    };

    const videos = ((data.items ?? []) as YouTubeItem[]).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channel: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("GET /api/student/youtube-suggestions:", error);
    return NextResponse.json({ videos: [], error: "Failed to fetch suggestions." });
  }
}

export async function POST(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const body = await request.json() as {
      videoId?: string;
      title?: string;
      channel?: string;
      thumbnail?: string;
      query?: string;
    };

    const { videoId, title, channel, thumbnail, query } = body;
    if (!videoId || !title) {
      return NextResponse.json({ error: "videoId and title are required." }, { status: 400 });
    }

    await logActivity({
      actorId: student.userId,
      action: "youtube.viewed",
      entityType: "youtube_video",
      entityId: videoId,
      summary: title,
      metadata: {
        videoId,
        title,
        channel: channel ?? null,
        thumbnail: thumbnail ?? null,
        query: query ?? null,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/student/youtube-suggestions:", error);
    return NextResponse.json({ error: "Failed to track view." }, { status: 500 });
  }
}
