CREATE TABLE IF NOT EXISTS "support_ticket_action_history" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_admin_id" TEXT,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "from_status" TEXT,
    "to_status" TEXT,
    "from_priority" TEXT,
    "to_priority" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_action_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_ticket_assignment_history" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_admin_id" TEXT,
    "actor_user_id" TEXT,
    "previous_admin_id" TEXT,
    "next_admin_id" TEXT,
    "previous_sla_hours" INTEGER,
    "next_sla_hours" INTEGER,
    "previous_sla_due_at" TIMESTAMPTZ(6),
    "next_sla_due_at" TIMESTAMPTZ(6),
    "note" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_assignment_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_moderation_case_action_history" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "actor_admin_id" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "from_status" TEXT,
    "to_status" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_moderation_case_action_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_moderation_case_assignment_history" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "actor_admin_id" TEXT,
    "previous_admin_id" TEXT,
    "next_admin_id" TEXT,
    "previous_severity" TEXT,
    "next_severity" TEXT,
    "note" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_moderation_case_assignment_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_ticket_action_history_ticket_id_created_at_idx" ON "support_ticket_action_history"("ticket_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "support_ticket_action_history_actor_admin_id_created_at_idx" ON "support_ticket_action_history"("actor_admin_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "support_ticket_action_history_actor_user_id_created_at_idx" ON "support_ticket_action_history"("actor_user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "support_ticket_assignment_history_ticket_id_created_at_idx" ON "support_ticket_assignment_history"("ticket_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "support_ticket_assignment_history_actor_admin_id_created_at_idx" ON "support_ticket_assignment_history"("actor_admin_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "support_ticket_assignment_history_next_admin_id_created_at_idx" ON "support_ticket_assignment_history"("next_admin_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "admin_moderation_case_action_history_case_id_created_at_idx" ON "admin_moderation_case_action_history"("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_moderation_case_action_history_actor_admin_id_created_idx" ON "admin_moderation_case_action_history"("actor_admin_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "admin_moderation_case_assignment_history_case_id_created_at_idx" ON "admin_moderation_case_assignment_history"("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_moderation_case_assignment_history_actor_admin_id_cre_idx" ON "admin_moderation_case_assignment_history"("actor_admin_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "admin_moderation_case_assignment_history_next_admin_id_crea_idx" ON "admin_moderation_case_assignment_history"("next_admin_id", "created_at" DESC);

DO $$
BEGIN
    ALTER TABLE "support_ticket_action_history"
        ADD CONSTRAINT "support_ticket_action_history_ticket_id_fkey"
        FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_action_history"
        ADD CONSTRAINT "support_ticket_action_history_actor_admin_id_fkey"
        FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_action_history"
        ADD CONSTRAINT "support_ticket_action_history_actor_user_id_fkey"
        FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_assignment_history"
        ADD CONSTRAINT "support_ticket_assignment_history_ticket_id_fkey"
        FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_assignment_history"
        ADD CONSTRAINT "support_ticket_assignment_history_actor_admin_id_fkey"
        FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_assignment_history"
        ADD CONSTRAINT "support_ticket_assignment_history_actor_user_id_fkey"
        FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_assignment_history"
        ADD CONSTRAINT "support_ticket_assignment_history_previous_admin_id_fkey"
        FOREIGN KEY ("previous_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "support_ticket_assignment_history"
        ADD CONSTRAINT "support_ticket_assignment_history_next_admin_id_fkey"
        FOREIGN KEY ("next_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "admin_moderation_case_action_history"
        ADD CONSTRAINT "admin_moderation_case_action_history_case_id_fkey"
        FOREIGN KEY ("case_id") REFERENCES "admin_moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "admin_moderation_case_action_history"
        ADD CONSTRAINT "admin_moderation_case_action_history_actor_admin_id_fkey"
        FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "admin_moderation_case_assignment_history"
        ADD CONSTRAINT "admin_moderation_case_assignment_history_case_id_fkey"
        FOREIGN KEY ("case_id") REFERENCES "admin_moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "admin_moderation_case_assignment_history"
        ADD CONSTRAINT "admin_moderation_case_assignment_history_actor_admin_id_fkey"
        FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "admin_moderation_case_assignment_history"
        ADD CONSTRAINT "admin_moderation_case_assignment_history_previous_admin_id_fkey"
        FOREIGN KEY ("previous_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "admin_moderation_case_assignment_history"
        ADD CONSTRAINT "admin_moderation_case_assignment_history_next_admin_id_fkey"
        FOREIGN KEY ("next_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
