-- CreateTable
CREATE TABLE "chat_user_preferences" (
    "user_id" TEXT NOT NULL,
    "notification_preferences" JSONB NOT NULL DEFAULT '{}',
    "safety_config" JSONB NOT NULL DEFAULT '{}',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "chat_thread_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "unread" BOOLEAN NOT NULL DEFAULT false,
    "cleared_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_thread_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user_hidden_entities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_hidden_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user_archived_entities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_archived_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_live_stream_sessions" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Live',
    "location" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "quick_options" JSONB NOT NULL DEFAULT '[]',
    "preview_image_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_live_stream_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_live_stream_comments" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_live_stream_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_live_stream_reactions" (
    "id" TEXT NOT NULL,
    "stream_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_live_stream_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_thread_preferences_user_id_thread_id_key" ON "chat_thread_preferences"("user_id", "thread_id");

-- CreateIndex
CREATE INDEX "chat_thread_preferences_user_id_pinned_updated_at_idx" ON "chat_thread_preferences"("user_id", "pinned", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "chat_thread_preferences_thread_id_updated_at_idx" ON "chat_thread_preferences"("thread_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_hidden_entities_user_id_target_id_target_type_key" ON "app_user_hidden_entities"("user_id", "target_id", "target_type");

-- CreateIndex
CREATE INDEX "app_user_hidden_entities_user_id_target_type_created_at_idx" ON "app_user_hidden_entities"("user_id", "target_type", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_archived_entities_user_id_target_id_target_type_key" ON "app_user_archived_entities"("user_id", "target_id", "target_type");

-- CreateIndex
CREATE INDEX "app_user_archived_entities_user_id_target_type_created_at_idx" ON "app_user_archived_entities"("user_id", "target_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_live_stream_sessions_host_id_created_at_idx" ON "app_live_stream_sessions"("host_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_live_stream_sessions_status_created_at_idx" ON "app_live_stream_sessions"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_live_stream_comments_stream_id_created_at_idx" ON "app_live_stream_comments"("stream_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_live_stream_reactions_stream_id_created_at_idx" ON "app_live_stream_reactions"("stream_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_live_stream_reactions_stream_id_type_created_at_idx" ON "app_live_stream_reactions"("stream_id", "type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "chat_user_preferences" ADD CONSTRAINT "chat_user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_preferences" ADD CONSTRAINT "chat_thread_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_preferences" ADD CONSTRAINT "chat_thread_preferences_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_hidden_entities" ADD CONSTRAINT "app_user_hidden_entities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_archived_entities" ADD CONSTRAINT "app_user_archived_entities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_live_stream_sessions" ADD CONSTRAINT "app_live_stream_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_live_stream_sessions" ADD CONSTRAINT "app_live_stream_sessions_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_live_stream_comments" ADD CONSTRAINT "app_live_stream_comments_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "app_live_stream_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_live_stream_comments" ADD CONSTRAINT "app_live_stream_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_live_stream_reactions" ADD CONSTRAINT "app_live_stream_reactions_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "app_live_stream_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_live_stream_reactions" ADD CONSTRAINT "app_live_stream_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
