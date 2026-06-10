-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('ACADEMIC', 'EXAM', 'REGISTRATION', 'HOLIDAY', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "CalendarAudience" AS ENUM ('ALL', 'STUDENTS', 'LECTURERS', 'ADMIN');

-- CreateTable
CREATE TABLE "live_class_late_admissions" (
    "id" UUID NOT NULL,
    "live_class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_late_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_calendar_events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "event_type" "CalendarEventType" NOT NULL DEFAULT 'ACTIVITY',
    "audience" "CalendarAudience" NOT NULL DEFAULT 'ALL',
    "location" VARCHAR(255),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_class_late_admissions_live_class_id_student_id_key" ON "live_class_late_admissions"("live_class_id", "student_id");

-- CreateIndex
CREATE INDEX "idx_live_late_admit_class" ON "live_class_late_admissions"("live_class_id");

-- CreateIndex
CREATE INDEX "idx_calendar_events_start" ON "academic_calendar_events"("start_at");

-- AddForeignKey
ALTER TABLE "live_class_late_admissions" ADD CONSTRAINT "live_class_late_admissions_live_class_id_fkey" FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_late_admissions" ADD CONSTRAINT "live_class_late_admissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_calendar_events" ADD CONSTRAINT "academic_calendar_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
