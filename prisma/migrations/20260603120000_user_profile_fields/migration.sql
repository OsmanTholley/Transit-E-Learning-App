-- Optional profile fields shared across roles (admin uses profile_image on users)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "learning_goals" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "social_links" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "achievements" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
