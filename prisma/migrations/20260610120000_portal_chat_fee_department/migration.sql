-- AlterTable
ALTER TABLE "fee_structures" ADD COLUMN IF NOT EXISTS "department_id" UUID;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PortalChatKind" AS ENUM ('COURSE', 'DIRECT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "portal_chat_messages" (
    "id" UUID NOT NULL,
    "kind" "PortalChatKind" NOT NULL,
    "course_id" UUID,
    "thread_key" VARCHAR(160) NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_portal_chat_thread_time" ON "portal_chat_messages"("thread_key", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_portal_chat_course_time" ON "portal_chat_messages"("course_id", "created_at");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "portal_chat_messages" ADD CONSTRAINT "portal_chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "portal_chat_messages" ADD CONSTRAINT "portal_chat_messages_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
