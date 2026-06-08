-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(100),
    "summary" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "label" VARCHAR(255),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_activity_logs_created" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_activity_logs_actor" ON "activity_logs"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default system settings
INSERT INTO "system_settings" ("id", "key", "value", "label", "updated_at")
VALUES
  (gen_random_uuid(), 'platform_name', '"Transit E-Learning"', 'Platform name', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'registration_open', 'true', 'Student registration open', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'maintenance_mode', 'false', 'Maintenance mode', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'announcement_email_alerts', 'false', 'Email alerts for announcements', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'default_academic_year', '"2025/2026"', 'Default academic year', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
