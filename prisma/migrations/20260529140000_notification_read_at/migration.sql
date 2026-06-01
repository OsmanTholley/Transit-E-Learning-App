-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "read_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_notifications_user_read_at" ON "notifications"("user_id", "read_at");
