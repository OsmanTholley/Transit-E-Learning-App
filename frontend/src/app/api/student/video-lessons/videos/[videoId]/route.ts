import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

async function fetchYouTubeVideoDetails(videoId: string, apiKey: string) {
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const durationISO = item.contentDetails?.duration || "";
    let durationLabel = "Video";
    const match = durationISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");
      const seconds = parseInt(match[3] || "0");
      if (hours > 0) {
        durationLabel = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      } else {
        durationLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;
      }
    }

    return {
      id: videoId,
      courseId: "youtube",
      courseCode: "YOUTUBE",
      courseTitle: "YouTube Tutorial",
      title: item.snippet.title,
      lecturerName: item.snippet.channelTitle,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      durationLabel,
      createdAt: item.snippet.publishedAt,
    };
  } catch (error) {
    console.error("fetchYouTubeVideoDetails error:", error);
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const studentProfile = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const locked = await buildFeeLockResponse(studentProfile.id, "videos");
    if (locked) return locked;

    const { videoId } = await params;

    const isYouTubeId = videoId.length === 11 || !videoId.includes("-");
    if (isYouTubeId) {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (apiKey) {
        const ytDetails = await fetchYouTubeVideoDetails(videoId, apiKey);
        if (ytDetails) {
          return NextResponse.json(ytDetails);
        }
      }
      return NextResponse.json({
        id: videoId,
        courseId: "youtube",
        courseCode: "YOUTUBE",
        courseTitle: "YouTube Tutorial",
        title: "YouTube Video Lesson",
        lecturerName: "YouTube Creator",
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        durationLabel: "Video",
        createdAt: new Date().toISOString(),
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { courseStudents: { select: { courseId: true } } },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const courseIds = student.courseStudents.map((e) => e.courseId);

    const video = await prisma.video.findFirst({
      where: { id: videoId, courseId: { in: courseIds } },
      include: {
        course: { select: { id: true, courseCode: true, courseTitle: true } },
        lecturer: { include: { user: { select: { fullName: true } } } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id,
      courseId: video.courseId,
      courseCode: video.course.courseCode,
      courseTitle: video.course.courseTitle,
      title: video.title ?? "Untitled Video",
      lecturerName: video.lecturer?.user.fullName ?? "Lecturer",
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl ?? null,
      durationLabel: video.duration ?? null,
      createdAt: video.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/student/video-lessons/videos/[videoId]:", error);
    return NextResponse.json({ error: "Failed to load video." }, { status: 500 });
  }
}

