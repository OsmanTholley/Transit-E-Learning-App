-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PortalChatMessageType" AS ENUM ('TEXT', 'VOICE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "portal_chat_messages" ADD COLUMN IF NOT EXISTS "message_type" "PortalChatMessageType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "portal_chat_messages" ADD COLUMN IF NOT EXISTS "audio_data" TEXT;
ALTER TABLE "portal_chat_messages" ALTER COLUMN "body" SET DEFAULT '';
