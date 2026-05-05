/*
  Warnings:

  - You are about to drop the `app_state_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "app_notification_campaign_action_history" DROP CONSTRAINT "app_notification_campaign_action_history_actor_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "app_notification_campaign_action_history" DROP CONSTRAINT "app_notification_campaign_action_history_campaign_id_fkey";

-- DropTable
DROP TABLE "app_state_snapshots";

-- RenameForeignKey
ALTER TABLE "app_settings_item_catalog" RENAME CONSTRAINT "app_settings_item_catalog_section_fkey" TO "app_settings_item_catalog_section_key_fkey";

-- AddForeignKey
ALTER TABLE "app_notification_campaign_action_history" ADD CONSTRAINT "app_notification_campaign_action_history_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "app_notification_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_notification_campaign_action_history" ADD CONSTRAINT "app_notification_campaign_action_history_actor_admin_id_fkey" FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "app_accessibility_option_catalog_active_sort_idx" RENAME TO "app_accessibility_option_catalog_is_active_sort_order_optio_idx";

-- RenameIndex
ALTER INDEX "app_analytics_snapshots_domain_snapshot_idx" RENAME TO "app_analytics_snapshots_domain_snapshot_at_idx";

-- RenameIndex
ALTER INDEX "app_analytics_snapshots_scope_snapshot_idx" RENAME TO "app_analytics_snapshots_scope_type_scope_id_snapshot_at_idx";

-- RenameIndex
ALTER INDEX "app_call_lifecycle_snapshots_actor_captured_idx" RENAME TO "app_call_lifecycle_snapshots_actor_user_id_captured_at_idx";

-- RenameIndex
ALTER INDEX "app_call_lifecycle_snapshots_session_captured_idx" RENAME TO "app_call_lifecycle_snapshots_call_session_id_captured_at_idx";

-- RenameIndex
ALTER INDEX "app_chat_presence_snapshots_thread_captured_idx" RENAME TO "app_chat_presence_snapshots_thread_id_captured_at_idx";

-- RenameIndex
ALTER INDEX "app_chat_presence_snapshots_user_captured_idx" RENAME TO "app_chat_presence_snapshots_user_id_captured_at_idx";

-- RenameIndex
ALTER INDEX "app_legal_document_versions_active_doc_published_idx" RENAME TO "app_legal_document_versions_is_active_document_key_publishe_idx";

-- RenameIndex
ALTER INDEX "app_legal_document_versions_key_version_locale_key" RENAME TO "app_legal_document_versions_document_key_version_locale_cod_key";

-- RenameIndex
ALTER INDEX "app_live_lifecycle_snapshots_actor_captured_idx" RENAME TO "app_live_lifecycle_snapshots_actor_user_id_captured_at_idx";

-- RenameIndex
ALTER INDEX "app_live_lifecycle_snapshots_stream_captured_idx" RENAME TO "app_live_lifecycle_snapshots_stream_id_captured_at_idx";

-- RenameIndex
ALTER INDEX "app_localization_locale_catalog_active_sort_idx" RENAME TO "app_localization_locale_catalog_is_active_sort_order_locale_idx";

-- RenameIndex
ALTER INDEX "app_notification_campaign_action_history_actor_created_idx" RENAME TO "app_notification_campaign_action_history_actor_admin_id_cre_idx";

-- RenameIndex
ALTER INDEX "app_notification_campaign_action_history_campaign_created_idx" RENAME TO "app_notification_campaign_action_history_campaign_id_create_idx";

-- RenameIndex
ALTER INDEX "app_onboarding_catalog_items_lookup_idx" RENAME TO "app_onboarding_catalog_items_catalog_type_is_active_sort_or_idx";

-- RenameIndex
ALTER INDEX "app_onboarding_catalog_items_type_code_key" RENAME TO "app_onboarding_catalog_items_catalog_type_code_key";

-- RenameIndex
ALTER INDEX "app_personalization_catalog_items_active_sort_idx" RENAME TO "app_personalization_catalog_items_is_active_sort_order_code_idx";

-- RenameIndex
ALTER INDEX "app_settings_item_catalog_section_sort_idx" RENAME TO "app_settings_item_catalog_section_key_is_active_sort_order__idx";

-- RenameIndex
ALTER INDEX "app_settings_section_catalog_active_sort_idx" RENAME TO "app_settings_section_catalog_is_active_sort_order_key_idx";

-- RenameIndex
ALTER INDEX "app_support_config_entries_public_key_idx" RENAME TO "app_support_config_entries_is_public_key_idx";
