export type LectureNoteRecord = {
  id: string;
  title: string;
  topic: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  semester: string | null;
  level: string | null;
  department: string;
  lecturerName: string;
  fileType: string;
  fileUrl: string;
  description: string | null;
  uploadedAt: string;
  uploadedAtIso: string;
  fileSizeLabel: string;
  isShared: boolean;
  isNew: boolean;
};

export type LectureNotesStats = {
  totalNotes: number;
  downloadedNotes: number;
  bookmarkedNotes: number;
  recentlyAdded: number;
  readCount: number;
  averageReadingProgress: number;
};

export type LectureNotesListResponse = {
  notes: LectureNoteRecord[];
  stats: LectureNotesStats;
  courses: { id: string; code: string; title: string; noteCount: number }[];
  semesters: string[];
};

export type CourseNotesGroup = {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  notes: LectureNoteRecord[];
};
