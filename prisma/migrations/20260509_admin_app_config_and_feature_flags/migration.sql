create table if not exists admin_app_config_entries (
  key text primary key,
  category text not null default 'general',
  title text not null,
  description text null,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz(6) not null default now()
);

create index if not exists admin_app_config_entries_category_key_idx
  on admin_app_config_entries (category, key);

create index if not exists admin_app_config_entries_is_public_category_idx
  on admin_app_config_entries (is_public, category);

create table if not exists admin_feature_flags (
  key text primary key,
  category text not null default 'general',
  title text not null,
  description text null,
  is_enabled boolean not null default false,
  rollout_percentage integer not null default 100,
  audience jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz(6) not null default now()
);

create index if not exists admin_feature_flags_category_key_idx
  on admin_feature_flags (category, key);

create index if not exists admin_feature_flags_is_enabled_category_idx
  on admin_feature_flags (is_enabled, category);
