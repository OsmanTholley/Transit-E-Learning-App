-- Portal chat read tracking
CREATE TABLE "portal_chat_thread_reads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "thread_key" VARCHAR(160) NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_chat_thread_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portal_chat_thread_reads_user_id_thread_key_key" ON "portal_chat_thread_reads"("user_id", "thread_key");
CREATE INDEX "idx_portal_chat_reads_user" ON "portal_chat_thread_reads"("user_id");

ALTER TABLE "portal_chat_thread_reads" ADD CONSTRAINT "portal_chat_thread_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Live session chat moderation fields
ALTER TABLE "portal_chat_messages" ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portal_chat_messages" ADD COLUMN IF NOT EXISTS "is_highlighted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portal_chat_messages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Payment plan required percentage & overrides
ALTER TABLE "fee_structures" ADD COLUMN IF NOT EXISTS "required_payment_percent" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "student_fee_accounts" ADD COLUMN IF NOT EXISTS "required_payment_percent" DOUBLE PRECISION;
ALTER TABLE "student_fee_accounts" ADD COLUMN IF NOT EXISTS "temporary_access_until" TIMESTAMP(3);
ALTER TABLE "student_fee_accounts" ADD COLUMN IF NOT EXISTS "restriction_overridden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "student_fee_accounts" ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMP(3);

-- Session creator tracking
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "created_by_id" UUID;
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
