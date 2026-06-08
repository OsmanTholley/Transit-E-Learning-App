-- CreateTable
CREATE TABLE "student_preferences" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "pref_key" VARCHAR(120) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_student_preferences_student" ON "student_preferences"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_preferences_student_id_pref_key_key" ON "student_preferences"("student_id", "pref_key");

-- AddForeignKey
ALTER TABLE "student_preferences" ADD CONSTRAINT "student_preferences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
