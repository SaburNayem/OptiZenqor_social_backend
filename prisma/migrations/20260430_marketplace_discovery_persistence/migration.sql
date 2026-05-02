CREATE TABLE IF NOT EXISTS "app_marketplace_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "condition" TEXT,
    "location" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_marketplace_drafts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "app_marketplace_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_marketplace_drafts_user_id_updated_at_idx"
ON "app_marketplace_drafts"("user_id", "updated_at" DESC);

CREATE TABLE IF NOT EXISTS "app_marketplace_seller_follows" (
    "follower_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_marketplace_seller_follows_pkey" PRIMARY KEY ("follower_id", "seller_id"),
    CONSTRAINT "app_marketplace_seller_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_seller_follows_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_marketplace_seller_follows_seller_id_created_at_idx"
ON "app_marketplace_seller_follows"("seller_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "app_marketplace_conversations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_marketplace_conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "app_marketplace_conversations_product_id_buyer_id_seller_id_key" UNIQUE ("product_id", "buyer_id", "seller_id"),
    CONSTRAINT "app_marketplace_conversations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_conversations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_conversations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_marketplace_conversations_buyer_id_updated_at_idx"
ON "app_marketplace_conversations"("buyer_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "app_marketplace_conversations_seller_id_updated_at_idx"
ON "app_marketplace_conversations"("seller_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "app_marketplace_conversations_product_id_updated_at_idx"
ON "app_marketplace_conversations"("product_id", "updated_at" DESC);

CREATE TABLE IF NOT EXISTS "app_marketplace_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_marketplace_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "app_marketplace_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "app_marketplace_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_marketplace_messages_conversation_id_created_at_idx"
ON "app_marketplace_messages"("conversation_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "app_marketplace_messages_sender_id_created_at_idx"
ON "app_marketplace_messages"("sender_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "app_marketplace_offers" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "acted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_marketplace_offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "app_marketplace_offers_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "app_marketplace_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "app_marketplace_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_marketplace_offers_product_id_created_at_idx"
ON "app_marketplace_offers"("product_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "app_marketplace_offers_buyer_id_created_at_idx"
ON "app_marketplace_offers"("buyer_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "app_marketplace_offers_seller_id_created_at_idx"
ON "app_marketplace_offers"("seller_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "app_marketplace_offers_conversation_id_created_at_idx"
ON "app_marketplace_offers"("conversation_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "app_discovery_trending_entries" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_discovery_trending_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "app_discovery_trending_entries_entity_type_entity_id_key" UNIQUE ("entity_type", "entity_id")
);

CREATE INDEX IF NOT EXISTS "app_discovery_trending_entries_score_updated_at_idx"
ON "app_discovery_trending_entries"("score" DESC, "updated_at" DESC);

CREATE TABLE IF NOT EXISTS "app_discovery_hashtag_entries" (
    "tag" TEXT NOT NULL,
    "display_tag" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_discovery_hashtag_entries_pkey" PRIMARY KEY ("tag")
);

CREATE INDEX IF NOT EXISTS "app_discovery_hashtag_entries_score_updated_at_idx"
ON "app_discovery_hashtag_entries"("score" DESC, "updated_at" DESC);
