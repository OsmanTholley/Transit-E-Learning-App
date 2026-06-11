-- LiveClass audience + live-class messenger threads
CREATE TYPE "LiveClassAudience" AS ENUM ('GENERAL', 'STUDENTS', 'LECTURERS');

ALTER TABLE "live_classes" ADD COLUMN "audience" "LiveClassAudience" NOT NULL DEFAULT 'GENERAL';

CREATE INDEX "idx_live_classes_audience_status" ON "live_classes"("audience", "status");

ALTER TYPE "PortalChatKind" ADD VALUE 'LIVE_CLASS';

ALTER TABLE "portal_chat_messages" ADD COLUMN "live_class_id" UUID;

ALTER TABLE "portal_chat_messages"
  ADD CONSTRAINT "portal_chat_messages_live_class_id_fkey"
  FOREIGN KEY ("live_class_id") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "idx_portal_chat_live_class_time" ON "portal_chat_messages"("live_class_id", "created_at");
