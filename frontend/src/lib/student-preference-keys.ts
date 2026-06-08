export const STUDENT_PREF_KEYS = {
  videoProgress: "transit.videoLessons.progress.v1",
  videoBookmarks: "transit.videoLessons.bookmarks.v1",
  videoDownloads: "transit.videoLessons.downloads.v1",
  videoHistory: "transit.videoLessons.history.v1",
  courseBookmarks: "transit_course_bookmarks",
  quizDrafts: "transit.quizzes.draft.v1",
  quizLastResults: "transit.quizzes.lastResult.v1",
  aiConversations: "transit.aiTutor.conversations.v1",
  aiSolved: "transit.aiTutor.solved.v1",
  aiPlanner: "transit.aiTutor.planner.v1",
  discussionLikes: "transit.discussions.likes.v1",
  discussionSaved: "transit.discussions.saved.v1",
  discussionStudyGroups: "transit.discussions.studyGroups.v1",
} as const;

export type StudentPrefKey = (typeof STUDENT_PREF_KEYS)[keyof typeof STUDENT_PREF_KEYS];
