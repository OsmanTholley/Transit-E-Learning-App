-- Migration: 20260606063200_add_description_and_gender
-- Reconciles the departments.description drift and adds gender to students/admitted_students.
-- Uses IF NOT EXISTS so it is safe regardless of current state.

-- Reconcile drift: departments.description already exists in the DB
-- (added via db push previously). This records it in migration history.
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- New: gender field on students
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "gender" TEXT;

-- New: gender field on admitted_students
ALTER TABLE "admitted_students" ADD COLUMN IF NOT EXISTS "gender" TEXT;
