-- AI conversations + usage tracking
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "title" VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_conversation_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_usage_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "messages_used" INTEGER NOT NULL DEFAULT 0,
    "total_tokens_used" INTEGER NOT NULL DEFAULT 0,
    "last_usage_at" TIMESTAMP(3),

    CONSTRAINT "ai_usage_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_usage_stats_user_id_key" ON "ai_usage_stats"("user_id");
CREATE INDEX "idx_ai_conversations_user_updated" ON "ai_conversations"("user_id", "updated_at");
CREATE INDEX "idx_ai_conversation_messages_conv_created" ON "ai_conversation_messages"("conversation_id", "created_at");

ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_conversation_messages" ADD CONSTRAINT "ai_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_usage_stats" ADD CONSTRAINT "ai_usage_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_structures" ADD COLUMN IF NOT EXISTS "description" TEXT;
