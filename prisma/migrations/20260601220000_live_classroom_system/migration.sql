-- AttendanceStatus: add PARTIAL
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

-- LiveClassStatus enum
CREATE TYPE "LiveClassStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- Extend live_classes
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255);
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "status" "LiveClassStatus" NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "room_name" VARCHAR(120);
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "recording_url" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "actual_start" TIMESTAMP(3);
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "actual_end" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "live_classes_room_name_key" ON "live_classes"("room_name");
CREATE INDEX IF NOT EXISTS "idx_live_classes_status_start" ON "live_classes"("status", "start_time");

-- Attendance logs
CREATE TABLE IF NOT EXISTS "live_class_attendance_logs" (
    "id" UUID NOT NULL,
    "live_class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_id_code" VARCHAR(50) NOT NULL,
    "student_name" VARCHAR(255) NOT NULL,
    "course_code" VARCHAR(50) NOT NULL,
    "course_title" VARCHAR(255) NOT NULL,
    "join_time" TIMESTAMP(3) NOT NULL,
    "exit_time" TIMESTAMP(3),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "attendance_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_class_attendance_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "live_class_attendance_logs_live_class_id_student_id_key"
  ON "live_class_attendance_logs"("live_class_id", "student_id");
CREATE INDEX IF NOT EXISTS "idx_live_attendance_class" ON "live_class_attendance_logs"("live_class_id");

ALTER TABLE "live_class_attendance_logs" ADD CONSTRAINT "live_class_attendance_logs_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_attendance_logs" ADD CONSTRAINT "live_class_attendance_logs_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Chat
CREATE TABLE IF NOT EXISTS "live_class_chat_messages" (
    "id" UUID NOT NULL,
    "live_class_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sender_name" VARCHAR(255) NOT NULL,
    "sender_role" "Role" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_live_chat_class_time" ON "live_class_chat_messages"("live_class_id", "created_at");

ALTER TABLE "live_class_chat_messages" ADD CONSTRAINT "live_class_chat_messages_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_chat_messages" ADD CONSTRAINT "live_class_chat_messages_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Polls
CREATE TABLE IF NOT EXISTS "live_class_polls" (
    "id" UUID NOT NULL,
    "live_class_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_polls_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "live_class_polls" ADD CONSTRAINT "live_class_polls_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "live_class_poll_votes" (
    "id" UUID NOT NULL,
    "poll_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "option_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_poll_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "live_class_poll_votes_poll_id_student_id_key"
  ON "live_class_poll_votes"("poll_id", "student_id");

ALTER TABLE "live_class_poll_votes" ADD CONSTRAINT "live_class_poll_votes_poll_id_fkey"
  FOREIGN KEY ("poll_id") REFERENCES "live_class_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_poll_votes" ADD CONSTRAINT "live_class_poll_votes_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand raises
CREATE TABLE IF NOT EXISTS "live_class_hand_raises" (
    "id" UUID NOT NULL,
    "live_class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_hand_raises_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "live_class_hand_raises_live_class_id_student_id_key"
  ON "live_class_hand_raises"("live_class_id", "student_id");

ALTER TABLE "live_class_hand_raises" ADD CONSTRAINT "live_class_hand_raises_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_class_hand_raises" ADD CONSTRAINT "live_class_hand_raises_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recordings
CREATE TABLE IF NOT EXISTS "live_class_recordings" (
    "id" UUID NOT NULL,
    "live_class_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "recording_url" TEXT NOT NULL,
    "duration_sec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_recordings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "live_class_recordings" ADD CONSTRAINT "live_class_recordings_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
