-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "interests" JSONB NOT NULL DEFAULT '[]',
    "role" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "wallet_summary" TEXT NOT NULL,
    "health" TEXT NOT NULL,
    "reports" TEXT NOT NULL,
    "last_active" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "cover_image_url" TEXT NOT NULL DEFAULT '',
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "note_privacy" TEXT NOT NULL DEFAULT 'followers',
    "supporter_badge" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_codes" (
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_codes_pkey" PRIMARY KEY ("email","purpose")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "access_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "refresh_expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "app_follow_relations" (
    "follower_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_follow_relations_pkey" PRIMARY KEY ("follower_id","target_id")
);

-- CreateTable
CREATE TABLE "app_buddy_requests" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "responded_at" TIMESTAMPTZ(6),
    "responded_by" TEXT,

    CONSTRAINT "app_buddy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_buddy_relations" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_buddy_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "media" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_post_reactions" (
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_post_reactions_pkey" PRIMARY KEY ("post_id","user_id")
);

-- CreateTable
CREATE TABLE "app_post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply_to" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "is_liked_by_me" BOOLEAN NOT NULL DEFAULT false,
    "is_reported" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "mentions" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "app_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_post_comment_reactions" (
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_post_comment_reactions_pkey" PRIMARY KEY ("comment_id","user_id")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "participants_label" TEXT NOT NULL,
    "flag" TEXT,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_thread_participants" (
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_thread_participants_pkey" PRIMARY KEY ("thread_id","user_id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "reply_to_message_id" TEXT,
    "delivery_state" TEXT NOT NULL DEFAULT 'sent',
    "kind" TEXT NOT NULL DEFAULT 'text',
    "media_path" TEXT,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_notifications" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "media" TEXT NOT NULL DEFAULT '',
    "media_items" JSONB NOT NULL DEFAULT '[]',
    "is_local_file" BOOLEAN NOT NULL DEFAULT false,
    "text" TEXT NOT NULL DEFAULT '',
    "music" TEXT,
    "background_colors" JSONB NOT NULL DEFAULT '[]',
    "text_color_value" BIGINT NOT NULL DEFAULT 4294967295,
    "sticker" TEXT,
    "effect_name" TEXT,
    "mention_username" TEXT,
    "mention_usernames" JSONB NOT NULL DEFAULT '[]',
    "link_label" TEXT,
    "link_url" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "location" TEXT,
    "collage_layout" TEXT,
    "text_offset_dx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "text_offset_dy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "text_scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "media_transforms" JSONB NOT NULL DEFAULT '[]',
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_story_comments" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_story_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_story_reactions" (
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_story_reactions_pkey" PRIMARY KEY ("story_id","user_id")
);

-- CreateTable
CREATE TABLE "app_story_views" (
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_story_views_pkey" PRIMARY KEY ("story_id","user_id")
);

-- CreateTable
CREATE TABLE "app_reels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "audio_name" TEXT NOT NULL DEFAULT '',
    "thumbnail_url" TEXT NOT NULL DEFAULT '',
    "video_url" TEXT NOT NULL DEFAULT '',
    "text_overlays" JSONB NOT NULL DEFAULT '[]',
    "subtitle_enabled" BOOLEAN NOT NULL DEFAULT false,
    "trim_info" TEXT,
    "remix_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_reels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_reel_comments" (
    "id" TEXT NOT NULL,
    "reel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_reel_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_reel_reactions" (
    "reel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_reel_reactions_pkey" PRIMARY KEY ("reel_id","user_id")
);

-- CreateTable
CREATE TABLE "app_uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "file_name" TEXT NOT NULL,
    "original_filename" TEXT,
    "mime_type" TEXT,
    "size_bytes" BIGINT,
    "url" TEXT,
    "secure_url" TEXT,
    "public_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "resource_type" TEXT,
    "folder" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'post',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "post_id" TEXT,
    "reel_id" TEXT,
    "product_id" TEXT,
    "collection_id" TEXT,

    CONSTRAINT "app_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "post_id" TEXT,
    "reel_id" TEXT,
    "product_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user_blocks" (
    "actor_user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_blocks_pkey" PRIMARY KEY ("actor_user_id","target_user_id")
);

-- CreateTable
CREATE TABLE "app_user_reports" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "target_entity_id" TEXT,
    "target_entity_type" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "post_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user_settings" (
    "user_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app_user_privacy" (
    "user_id" TEXT NOT NULL,
    "profile_private" BOOLEAN NOT NULL DEFAULT false,
    "activity_status" BOOLEAN NOT NULL DEFAULT true,
    "allow_tagging" BOOLEAN NOT NULL DEFAULT true,
    "allow_mentions" BOOLEAN NOT NULL DEFAULT true,
    "allow_reposts" BOOLEAN NOT NULL DEFAULT true,
    "allow_comments" BOOLEAN NOT NULL DEFAULT true,
    "hide_sensitive" BOOLEAN NOT NULL DEFAULT true,
    "hide_likes" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_privacy_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app_post_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "scheduled_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_post_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_scheduled_posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "draft_id" TEXT,
    "post_id" TEXT,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_marketplace_products" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "condition" TEXT,
    "location" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stock" INTEGER NOT NULL DEFAULT 1,
    "watchers" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_marketplace_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_marketplace_orders" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "address" TEXT NOT NULL,
    "delivery_method" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_jobs" (
    "id" TEXT NOT NULL,
    "recruiter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "experience_level" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'open',
    "skills" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_job_applications" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "applicant_name" TEXT NOT NULL,
    "cover_letter" TEXT,
    "resume_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_events" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer_name" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'review',
    "saved_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_event_rsvps" (
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_event_rsvps_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "app_communities" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "privacy" TEXT NOT NULL DEFAULT 'public',
    "category" TEXT,
    "location" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "links" JSONB NOT NULL DEFAULT '[]',
    "contact_info" TEXT,
    "cover_colors" JSONB NOT NULL DEFAULT '[]',
    "avatar_color" INTEGER,
    "approval_required" BOOLEAN NOT NULL DEFAULT false,
    "allow_events" BOOLEAN NOT NULL DEFAULT true,
    "allow_live" BOOLEAN NOT NULL DEFAULT false,
    "allow_polls" BOOLEAN NOT NULL DEFAULT true,
    "allow_marketplace" BOOLEAN NOT NULL DEFAULT false,
    "allow_chat_room" BOOLEAN NOT NULL DEFAULT true,
    "notification_level" TEXT NOT NULL DEFAULT 'all',
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_community_members" (
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_community_members_pkey" PRIMARY KEY ("community_id","user_id")
);

-- CreateTable
CREATE TABLE "app_pages" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "contact_label" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_page_follows" (
    "page_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_page_follows_pkey" PRIMARY KEY ("page_id","user_id")
);

-- CreateTable
CREATE TABLE "app_wallet_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_wallet_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_premium_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "billing_interval" TEXT NOT NULL DEFAULT 'monthly',
    "features" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_premium_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_notification_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_notification_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "plan_code" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMPTZ(6),
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_username_key" ON "app_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_access_token_key" ON "auth_sessions"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_key" ON "auth_sessions"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "app_buddy_requests_requester_id_target_id_key" ON "app_buddy_requests"("requester_id", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_buddy_relations_user_a_id_user_b_id_key" ON "app_buddy_relations"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "app_posts_author_id_created_at_idx" ON "app_posts"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_posts_created_at_idx" ON "app_posts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "app_post_comments_post_id_created_at_idx" ON "app_post_comments"("post_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_timestamp_idx" ON "chat_messages"("thread_id", "timestamp" ASC);

-- CreateIndex
CREATE INDEX "app_notifications_recipient_id_created_at_idx" ON "app_notifications"("recipient_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_stories_user_id_created_at_idx" ON "app_stories"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_stories_expires_at_idx" ON "app_stories"("expires_at");

-- CreateIndex
CREATE INDEX "app_story_comments_story_id_created_at_idx" ON "app_story_comments"("story_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "app_reels_user_id_created_at_idx" ON "app_reels"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_reel_comments_reel_id_created_at_idx" ON "app_reel_comments"("reel_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "app_uploads_user_id_created_at_idx" ON "app_uploads"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_bookmarks_user_id_created_at_idx" ON "app_bookmarks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_bookmarks_user_id_entity_id_key" ON "app_bookmarks"("user_id", "entity_id");

-- CreateIndex
CREATE INDEX "app_collections_user_id_updated_at_idx" ON "app_collections"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_collection_items_collection_id_entity_id_key" ON "app_collection_items"("collection_id", "entity_id");

-- CreateIndex
CREATE INDEX "app_user_reports_reporter_user_id_created_at_idx" ON "app_user_reports"("reporter_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_post_drafts_user_id_updated_at_idx" ON "app_post_drafts"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "app_scheduled_posts_user_id_scheduled_for_idx" ON "app_scheduled_posts"("user_id", "scheduled_for" ASC);

-- CreateIndex
CREATE INDEX "app_marketplace_products_seller_id_created_at_idx" ON "app_marketplace_products"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_marketplace_products_category_created_at_idx" ON "app_marketplace_products"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_marketplace_orders_buyer_id_created_at_idx" ON "app_marketplace_orders"("buyer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_marketplace_orders_seller_id_created_at_idx" ON "app_marketplace_orders"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_jobs_recruiter_id_created_at_idx" ON "app_jobs"("recruiter_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_jobs_status_created_at_idx" ON "app_jobs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_job_applications_applicant_id_created_at_idx" ON "app_job_applications"("applicant_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_job_applications_job_id_applicant_id_key" ON "app_job_applications"("job_id", "applicant_id");

-- CreateIndex
CREATE INDEX "app_events_organizer_id_created_at_idx" ON "app_events"("organizer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_events_status_created_at_idx" ON "app_events"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_communities_owner_id_created_at_idx" ON "app_communities"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_pages_owner_id_created_at_idx" ON "app_pages"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_wallet_accounts_user_id_key" ON "app_wallet_accounts"("user_id");

-- CreateIndex
CREATE INDEX "app_wallet_transactions_user_id_created_at_idx" ON "app_wallet_transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_wallet_transactions_wallet_account_id_created_at_idx" ON "app_wallet_transactions"("wallet_account_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_premium_plans_code_key" ON "app_premium_plans"("code");

-- CreateIndex
CREATE INDEX "app_notification_campaigns_created_at_idx" ON "app_notification_campaigns"("created_at" DESC);

-- CreateIndex
CREATE INDEX "app_subscriptions_user_id_created_at_idx" ON "app_subscriptions"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_follow_relations" ADD CONSTRAINT "app_follow_relations_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_follow_relations" ADD CONSTRAINT "app_follow_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_buddy_requests" ADD CONSTRAINT "app_buddy_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_buddy_requests" ADD CONSTRAINT "app_buddy_requests_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_buddy_requests" ADD CONSTRAINT "app_buddy_requests_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_buddy_relations" ADD CONSTRAINT "app_buddy_relations_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_buddy_relations" ADD CONSTRAINT "app_buddy_relations_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_posts" ADD CONSTRAINT "app_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_reactions" ADD CONSTRAINT "app_post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "app_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_reactions" ADD CONSTRAINT "app_post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_comments" ADD CONSTRAINT "app_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "app_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_comments" ADD CONSTRAINT "app_post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_comments" ADD CONSTRAINT "app_post_comments_reply_to_fkey" FOREIGN KEY ("reply_to") REFERENCES "app_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_comment_reactions" ADD CONSTRAINT "app_post_comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "app_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_comment_reactions" ADD CONSTRAINT "app_post_comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_participants" ADD CONSTRAINT "chat_thread_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_participants" ADD CONSTRAINT "chat_thread_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_notifications" ADD CONSTRAINT "app_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_stories" ADD CONSTRAINT "app_stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_story_comments" ADD CONSTRAINT "app_story_comments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "app_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_story_comments" ADD CONSTRAINT "app_story_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_story_reactions" ADD CONSTRAINT "app_story_reactions_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "app_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_story_reactions" ADD CONSTRAINT "app_story_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_story_views" ADD CONSTRAINT "app_story_views_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "app_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_story_views" ADD CONSTRAINT "app_story_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_reels" ADD CONSTRAINT "app_reels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_reel_comments" ADD CONSTRAINT "app_reel_comments_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "app_reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_reel_comments" ADD CONSTRAINT "app_reel_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_reel_reactions" ADD CONSTRAINT "app_reel_reactions_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "app_reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_reel_reactions" ADD CONSTRAINT "app_reel_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_uploads" ADD CONSTRAINT "app_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_bookmarks" ADD CONSTRAINT "app_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_bookmarks" ADD CONSTRAINT "app_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "app_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_bookmarks" ADD CONSTRAINT "app_bookmarks_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "app_reels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_bookmarks" ADD CONSTRAINT "app_bookmarks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_marketplace_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_bookmarks" ADD CONSTRAINT "app_bookmarks_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "app_collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collections" ADD CONSTRAINT "app_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collection_items" ADD CONSTRAINT "app_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "app_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collection_items" ADD CONSTRAINT "app_collection_items_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "app_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collection_items" ADD CONSTRAINT "app_collection_items_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "app_reels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collection_items" ADD CONSTRAINT "app_collection_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_marketplace_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_blocks" ADD CONSTRAINT "app_user_blocks_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_blocks" ADD CONSTRAINT "app_user_blocks_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_reports" ADD CONSTRAINT "app_user_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_reports" ADD CONSTRAINT "app_user_reports_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_reports" ADD CONSTRAINT "app_user_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "app_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_settings" ADD CONSTRAINT "app_user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_privacy" ADD CONSTRAINT "app_user_privacy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_post_drafts" ADD CONSTRAINT "app_post_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_scheduled_posts" ADD CONSTRAINT "app_scheduled_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_scheduled_posts" ADD CONSTRAINT "app_scheduled_posts_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "app_post_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_scheduled_posts" ADD CONSTRAINT "app_scheduled_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "app_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_marketplace_products" ADD CONSTRAINT "app_marketplace_products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_marketplace_orders" ADD CONSTRAINT "app_marketplace_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_marketplace_orders" ADD CONSTRAINT "app_marketplace_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_marketplace_orders" ADD CONSTRAINT "app_marketplace_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_jobs" ADD CONSTRAINT "app_jobs_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_job_applications" ADD CONSTRAINT "app_job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "app_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_job_applications" ADD CONSTRAINT "app_job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_events" ADD CONSTRAINT "app_events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_event_rsvps" ADD CONSTRAINT "app_event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "app_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_event_rsvps" ADD CONSTRAINT "app_event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_communities" ADD CONSTRAINT "app_communities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_community_members" ADD CONSTRAINT "app_community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "app_communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_community_members" ADD CONSTRAINT "app_community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pages" ADD CONSTRAINT "app_pages_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_page_follows" ADD CONSTRAINT "app_page_follows_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "app_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_page_follows" ADD CONSTRAINT "app_page_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallet_accounts" ADD CONSTRAINT "app_wallet_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallet_transactions" ADD CONSTRAINT "app_wallet_transactions_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "app_wallet_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_wallet_transactions" ADD CONSTRAINT "app_wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "app_premium_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

