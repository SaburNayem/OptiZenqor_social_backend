CREATE TABLE IF NOT EXISTS "app_settings_section_catalog" (
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_settings_section_catalog_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "app_settings_section_catalog_active_sort_idx"
  ON "app_settings_section_catalog"("is_active","sort_order","key");

CREATE TABLE IF NOT EXISTS "app_settings_item_catalog" (
  "key" TEXT NOT NULL,
  "section_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "route_name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "default_data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_settings_item_catalog_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "app_settings_item_catalog_section_fkey"
    FOREIGN KEY ("section_key")
    REFERENCES "app_settings_section_catalog"("key")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_item_catalog_route_name_key"
  ON "app_settings_item_catalog"("route_name");

CREATE INDEX IF NOT EXISTS "app_settings_item_catalog_section_sort_idx"
  ON "app_settings_item_catalog"("section_key","is_active","sort_order","key");
