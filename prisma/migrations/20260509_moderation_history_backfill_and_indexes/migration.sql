create index if not exists admin_moderation_cases_assigned_status_updated_at_idx
  on admin_moderation_cases (assigned_to_admin_id, status, updated_at desc);

insert into admin_moderation_case_action_history (
  id,
  case_id,
  actor_admin_id,
  action,
  note,
  from_status,
  to_status,
  payload,
  created_at
)
select
  'mod_case_action_' || md5(mc.id || ':' || legacy.ordinality::text || ':' || legacy.entry),
  mc.id,
  null,
  'legacy_import',
  legacy.entry,
  null,
  mc.status,
  jsonb_build_object(
    'source', 'legacy_history',
    'legacyIndex', legacy.ordinality
  ),
  mc.created_at + ((legacy.ordinality - 1) * interval '1 second')
from admin_moderation_cases mc
cross join lateral jsonb_array_elements_text(
  case
    when jsonb_typeof(mc.history::jsonb) = 'array' then mc.history::jsonb
    else '[]'::jsonb
  end
) with ordinality as legacy(entry, ordinality)
where legacy.entry is not null
  and btrim(legacy.entry) <> ''
  and not exists (
    select 1
    from admin_moderation_case_action_history existing
    where existing.case_id = mc.id
      and existing.action = 'legacy_import'
      and existing.note = legacy.entry
  );
