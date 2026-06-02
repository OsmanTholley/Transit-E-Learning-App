-- AlterTable
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "syllabus_text" TEXT;

-- AlterTable
ALTER TABLE "lecture_notes" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "deletion_notice" TEXT;
