alter table if exists app_push_device_tokens
  add column if not exists app_version text;
