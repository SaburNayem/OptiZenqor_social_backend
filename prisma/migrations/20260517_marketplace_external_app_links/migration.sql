ALTER TABLE "app_marketplace_products"
  ADD COLUMN IF NOT EXISTS "external_app_name" TEXT,
  ADD COLUMN IF NOT EXISTS "external_app_link" TEXT,
  ADD COLUMN IF NOT EXISTS "play_store_url" TEXT,
  ADD COLUMN IF NOT EXISTS "android_package" TEXT;
