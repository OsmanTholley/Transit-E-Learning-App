-- CreateTable
CREATE TABLE "student_message_broadcasts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "audience_type" VARCHAR(50) NOT NULL,
    "audience_label" VARCHAR(255) NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "sent_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_message_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_student_message_broadcasts_created" ON "student_message_broadcasts"("created_at");

-- AddForeignKey
ALTER TABLE "student_message_broadcasts" ADD CONSTRAINT "student_message_broadcasts_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
