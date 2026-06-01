-- CreateTable
CREATE TABLE "admitted_students" (
    "id" UUID NOT NULL,
    "student_id" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "department_id" UUID,
    "program_id" UUID,
    "level" VARCHAR(50),
    "semester" VARCHAR(50),
    "admission_year" VARCHAR(10),
    "registered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admitted_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admitted_students_student_id_key" ON "admitted_students"("student_id");

-- CreateIndex
CREATE INDEX "idx_admitted_students_student_id" ON "admitted_students"("student_id");

-- AddForeignKey
ALTER TABLE "admitted_students" ADD CONSTRAINT "admitted_students_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admitted_students" ADD CONSTRAINT "admitted_students_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
