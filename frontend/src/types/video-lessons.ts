export type VideoLesson = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  lecturerName: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationLabel: string | null;
  createdAt: string;
};

export type LiveClassSession = {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  meetingLink: string | null;
  startTime: string | null;
  endTime: string | null;
};

