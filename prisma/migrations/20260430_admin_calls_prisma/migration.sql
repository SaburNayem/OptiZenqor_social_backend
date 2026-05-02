CREATE TABLE IF NOT EXISTS "app_call_sessions" (
  "id" TEXT NOT NULL,
  "room_name" TEXT NOT NULL,
  "thread_id" TEXT,
  "initiator_id" TEXT NOT NULL,
  "recipient_ids" JSONB NOT NULL DEFAULT '[]',
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMPTZ(6) NOT NULL,
  "ended_at" TIMESTAMPTZ(6),
  "ended_by" TEXT,
  "reason" TEXT,
  CONSTRAINT "app_call_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "app_call_session_participants" (
  "session_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "joined_at" TIMESTAMPTZ(6),
  "left_at" TIMESTAMPTZ(6),
  CONSTRAINT "app_call_session_participants_pkey" PRIMARY KEY ("session_id","user_id")
);

CREATE TABLE IF NOT EXISTS "app_call_session_signals" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "from_user_id" TEXT NOT NULL,
  "to_user_id" TEXT,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "app_call_session_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "app_push_device_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "device_label" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_push_device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT NOT NULL,
  "device" TEXT NOT NULL DEFAULT 'Unknown device',
  "ip_address" TEXT NOT NULL DEFAULT '0.0.0.0',
  "current" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_active" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_admin_id" TEXT,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_moderation_cases" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "target_id" TEXT,
  "target_label" TEXT,
  "reason" TEXT NOT NULL,
  "evidence" JSONB NOT NULL DEFAULT '[]',
  "history" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'open',
  "enforcement_actions" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "assigned_to_admin_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_moderation_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_operational_settings" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL DEFAULT '{}',
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_operational_settings_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_push_device_tokens_token_key" ON "app_push_device_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_sessions_access_token_key" ON "admin_sessions"("access_token");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_sessions_refresh_token_key" ON "admin_sessions"("refresh_token");

CREATE INDEX IF NOT EXISTS "app_call_sessions_initiator_id_started_at_idx" ON "app_call_sessions"("initiator_id","started_at" DESC);
CREATE INDEX IF NOT EXISTS "app_call_sessions_status_started_at_idx" ON "app_call_sessions"("status","started_at" DESC);
CREATE INDEX IF NOT EXISTS "app_call_session_participants_user_id_joined_at_idx" ON "app_call_session_participants"("user_id","joined_at" DESC);
CREATE INDEX IF NOT EXISTS "app_call_session_signals_session_id_created_at_idx" ON "app_call_session_signals"("session_id","created_at" ASC);
CREATE INDEX IF NOT EXISTS "app_call_session_signals_to_user_id_created_at_idx" ON "app_call_session_signals"("to_user_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "app_push_device_tokens_user_id_is_active_updated_at_idx" ON "app_push_device_tokens"("user_id","is_active","updated_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_sessions_access_token_idx" ON "admin_sessions"("access_token");
CREATE INDEX IF NOT EXISTS "admin_sessions_admin_id_created_at_idx" ON "admin_sessions"("admin_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_actor_admin_id_created_at_idx" ON "admin_audit_logs"("actor_admin_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_entity_type_created_at_idx" ON "admin_audit_logs"("entity_type","created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_moderation_cases_status_updated_at_idx" ON "admin_moderation_cases"("status","updated_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_moderation_cases_target_type_updated_at_idx" ON "admin_moderation_cases"("target_type","updated_at" DESC);

ALTER TABLE "app_call_sessions"
  ADD CONSTRAINT "app_call_sessions_thread_id_fkey"
  FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "app_call_sessions"
  ADD CONSTRAINT "app_call_sessions_initiator_id_fkey"
  FOREIGN KEY ("initiator_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_sessions"
  ADD CONSTRAINT "app_call_sessions_ended_by_fkey"
  FOREIGN KEY ("ended_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "app_call_session_participants"
  ADD CONSTRAINT "app_call_session_participants_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "app_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_session_participants"
  ADD CONSTRAINT "app_call_session_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_session_signals"
  ADD CONSTRAINT "app_call_session_signals_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "app_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_session_signals"
  ADD CONSTRAINT "app_call_session_signals_from_user_id_fkey"
  FOREIGN KEY ("from_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_call_session_signals"
  ADD CONSTRAINT "app_call_session_signals_to_user_id_fkey"
  FOREIGN KEY ("to_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "app_push_device_tokens"
  ADD CONSTRAINT "app_push_device_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_sessions"
  ADD CONSTRAINT "admin_sessions_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs"
  ADD CONSTRAINT "admin_audit_logs_actor_admin_id_fkey"
  FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_moderation_cases"
  ADD CONSTRAINT "admin_moderation_cases_assigned_to_admin_id_fkey"
  FOREIGN KEY ("assigned_to_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
