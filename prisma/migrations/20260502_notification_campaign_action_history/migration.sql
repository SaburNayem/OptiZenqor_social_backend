create table if not exists app_notification_campaign_action_history (
  id text primary key,
  campaign_id text not null references app_notification_campaigns(id) on delete cascade,
  actor_admin_id text null references admin_users(id) on delete set null,
  action text not null,
  note text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_notification_campaign_action_history_campaign_created_idx
  on app_notification_campaign_action_history (campaign_id, created_at desc);

create index if not exists app_notification_campaign_action_history_actor_created_idx
  on app_notification_campaign_action_history (actor_admin_id, created_at desc);
