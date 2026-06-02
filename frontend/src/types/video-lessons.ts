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

