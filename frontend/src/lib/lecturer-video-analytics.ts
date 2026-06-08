import { prisma } from "@/lib/prisma";
import { STUDENT_PREF_KEYS } from "@/lib/student-preference-keys";
import { getContentEngagement } from "@/lib/content-social";

type ProgressRecord = Record<
  string,
  { secondsWatched: number; durationSeconds: number; updatedAt: string }
>;

function toPercent(secondsWatched: number, durationSeconds: number) {
  if (durationSeconds <= 0) return 0;
  return Math.min(100, Math.round((secondsWatched / durationSeconds) * 100));
}

export async function getLecturerVideoAnalytics(lecturerId: string, videoId: string) {
  const video = await prisma.video.findFirst({
    where: { id: videoId, lecturerId },
    include: {
      course: {
        select: {
          id: true,
          courseCode: true,
          courseTitle: true,
          courseStudents: {
            include: {
              student: {
                include: {
                  user: { select: { fullName: true, email: true } },
                  preferences: {
                    where: { prefKey: STUDENT_PREF_KEYS.videoProgress },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!video) return null;

  const engagement = await getContentEngagement("VIDEO", videoId, null);

  const watchers = video.course.courseStudents
    .map((enrollment) => {
      const pref = enrollment.student.preferences[0]?.value as ProgressRecord | undefined;
      const snap = pref?.[videoId];
      if (!snap) return null;
      const percent = toPercent(snap.secondsWatched, snap.durationSeconds);
      if (percent <= 0) return null;
      return {
        studentId: enrollment.student.id,
        fullName: enrollment.student.user.fullName,
        email: enrollment.student.user.email,
        percent,
        lastWatchedAt: snap.updatedAt,
        secondsWatched: snap.secondsWatched,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.percent ?? 0) - (a?.percent ?? 0)) as {
    studentId: string;
    fullName: string;
    email: string;
    percent: number;
    lastWatchedAt: string;
    secondsWatched: number;
  }[];

  const lecturerComments = engagement.comments.filter((c) => c.authorRole === "LECTURER");
  const pinnedComment =
    lecturerComments.length > 0
      ? lecturerComments.reduce((latest, c) =>
          new Date(c.createdAt) > new Date(latest.createdAt) ? c : latest
        )
      : null;

  return {
    video: {
      id: video.id,
      title: video.title ?? "Video lesson",
      courseCode: video.course.courseCode,
      courseTitle: video.course.courseTitle,
      videoUrl: video.videoUrl,
      duration: video.duration,
      expiresAt: video.expiresAt?.toISOString() ?? null,
    },
    stats: {
      enrolledCount: video.course.courseStudents.length,
      watcherCount: watchers.length,
      commentCount: engagement.comments.length,
      likeCount: engagement.likeCount,
      completionRate:
        watchers.length > 0
          ? Math.round(watchers.filter((w) => w.percent >= 95).length / watchers.length * 100)
          : 0,
    },
    watchers,
    comments: engagement.comments,
    pinnedComment,
  };
}
