-- Course syllabus text (if missing)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "syllabus_text" TEXT;

-- Lecture note cover
ALTER TABLE "lecture_notes" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;

-- Video expiry fields
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "deletion_notice" TEXT;

-- ContentTargetType enum
DO $$ BEGIN
  CREATE TYPE "ContentTargetType" AS ENUM ('LECTURE_NOTE', 'VIDEO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "content_comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "target_type" "ContentTargetType" NOT NULL,
  "target_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_likes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "target_type" "ContentTargetType" NOT NULL,
  "target_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_likes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_content_comments_target" ON "content_comments"("target_type", "target_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_content_likes_target_user" ON "content_likes"("target_type", "target_id", "user_id");

ALTER TABLE "content_comments" DROP CONSTRAINT IF EXISTS "content_comments_user_id_fkey";
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_likes" DROP CONSTRAINT IF EXISTS "content_likes_user_id_fkey";
ALTER TABLE "content_likes" ADD CONSTRAINT "content_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
