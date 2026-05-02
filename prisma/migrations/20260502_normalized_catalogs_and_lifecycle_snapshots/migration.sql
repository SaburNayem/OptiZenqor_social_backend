CREATE TABLE IF NOT EXISTS "app_localization_locale_catalog" (
  "locale_code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "native_label" TEXT,
  "region_code" TEXT,
  "fallback_locale_code" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_localization_locale_catalog_pkey" PRIMARY KEY ("locale_code")
);

CREATE INDEX IF NOT EXISTS "app_localization_locale_catalog_active_sort_idx"
  ON "app_localization_locale_catalog"("is_active","sort_order","locale_code");

CREATE TABLE IF NOT EXISTS "app_accessibility_option_catalog" (
  "id" TEXT NOT NULL,
  "option_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "setting_key" TEXT,
  "value_type" TEXT NOT NULL DEFAULT 'boolean',
  "default_value" JSONB NOT NULL DEFAULT 'false'::jsonb,
  "options" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_accessibility_option_catalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_accessibility_option_catalog_option_key_key"
  ON "app_accessibility_option_catalog"("option_key");

CREATE INDEX IF NOT EXISTS "app_accessibility_option_catalog_active_sort_idx"
  ON "app_accessibility_option_catalog"("is_active","sort_order","option_key");

CREATE TABLE IF NOT EXISTS "app_legal_document_versions" (
  "id" TEXT NOT NULL,
  "document_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "locale_code" TEXT NOT NULL DEFAULT 'en',
  "summary" TEXT,
  "body" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "published_at" TIMESTAMPTZ(6),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_legal_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_legal_document_versions_key_version_locale_key"
  ON "app_legal_document_versions"("document_key","version","locale_code");

CREATE INDEX IF NOT EXISTS "app_legal_document_versions_active_doc_published_idx"
  ON "app_legal_document_versions"("is_active","document_key","published_at" DESC);

CREATE TABLE IF NOT EXISTS "app_support_config_entries" (
  "key" TEXT NOT NULL,
  "title" TEXT,
  "value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "description" TEXT,
  "is_public" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_support_config_entries_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "app_support_config_entries_public_key_idx"
  ON "app_support_config_entries"("is_public","key");

CREATE TABLE IF NOT EXISTS "app_onboarding_catalog_items" (
  "id" TEXT NOT NULL,
  "catalog_type" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_onboarding_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_onboarding_catalog_items_type_code_key"
  ON "app_onboarding_catalog_items"("catalog_type","code");

CREATE INDEX IF NOT EXISTS "app_onboarding_catalog_items_lookup_idx"
  ON "app_onboarding_catalog_items"("catalog_type","is_active","sort_order");

CREATE TABLE IF NOT EXISTS "app_personalization_catalog_items" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "group_key" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_personalization_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_personalization_catalog_items_code_key"
  ON "app_personalization_catalog_items"("code");

CREATE INDEX IF NOT EXISTS "app_personalization_catalog_items_active_sort_idx"
  ON "app_personalization_catalog_items"("is_active","sort_order","code");

CREATE TABLE IF NOT EXISTS "app_analytics_snapshots" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "metric_key" TEXT NOT NULL,
  "scope_type" TEXT,
  "scope_id" TEXT,
  "snapshot_at" TIMESTAMPTZ(6) NOT NULL,
  "numeric_value" DECIMAL(18,2),
  "string_value" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "app_analytics_snapshots_domain_snapshot_idx"
  ON "app_analytics_snapshots"("domain","snapshot_at" DESC);

CREATE INDEX IF NOT EXISTS "app_analytics_snapshots_scope_snapshot_idx"
  ON "app_analytics_snapshots"("scope_type","scope_id","snapshot_at" DESC);

CREATE TABLE IF NOT EXISTS "app_chat_presence_snapshots" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "thread_id" TEXT,
  "online" BOOLEAN NOT NULL DEFAULT false,
  "socket_count" INTEGER NOT NULL DEFAULT 0,
  "typing_thread_ids" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "app_chat_presence_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "app_chat_presence_snapshots_user_captured_idx"
  ON "app_chat_presence_snapshots"("user_id","captured_at" DESC);

CREATE INDEX IF NOT EXISTS "app_chat_presence_snapshots_thread_captured_idx"
  ON "app_chat_presence_snapshots"("thread_id","captured_at" DESC);

CREATE TABLE IF NOT EXISTS "app_call_lifecycle_snapshots" (
  "id" TEXT NOT NULL,
  "call_session_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_call_lifecycle_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "app_call_lifecycle_snapshots_session_captured_idx"
  ON "app_call_lifecycle_snapshots"("call_session_id","captured_at" DESC);

CREATE INDEX IF NOT EXISTS "app_call_lifecycle_snapshots_actor_captured_idx"
  ON "app_call_lifecycle_snapshots"("actor_user_id","captured_at" DESC);

CREATE TABLE IF NOT EXISTS "app_live_lifecycle_snapshots" (
  "id" TEXT NOT NULL,
  "stream_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_live_lifecycle_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "app_live_lifecycle_snapshots_stream_captured_idx"
  ON "app_live_lifecycle_snapshots"("stream_id","captured_at" DESC);

CREATE INDEX IF NOT EXISTS "app_live_lifecycle_snapshots_actor_captured_idx"
  ON "app_live_lifecycle_snapshots"("actor_user_id","captured_at" DESC);

ALTER TABLE "app_chat_presence_snapshots"
  ADD CONSTRAINT "app_chat_presence_snapshots_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_lifecycle_snapshots"
  ADD CONSTRAINT "app_call_lifecycle_snapshots_call_session_id_fkey"
  FOREIGN KEY ("call_session_id") REFERENCES "app_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_lifecycle_snapshots"
  ADD CONSTRAINT "app_call_lifecycle_snapshots_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "app_live_lifecycle_snapshots"
  ADD CONSTRAINT "app_live_lifecycle_snapshots_stream_id_fkey"
  FOREIGN KEY ("stream_id") REFERENCES "app_live_stream_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_live_lifecycle_snapshots"
  ADD CONSTRAINT "app_live_lifecycle_snapshots_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
