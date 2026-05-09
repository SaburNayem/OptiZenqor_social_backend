alter table if exists support_tickets
  add column if not exists assigned_to_admin_id text,
  add column if not exists assigned_at timestamptz(6),
  add column if not exists sla_hours integer,
  add column if not exists sla_due_at timestamptz(6);

do $$
begin
  alter table support_tickets
    add constraint support_tickets_assigned_to_admin_id_fkey
    foreign key (assigned_to_admin_id) references admin_users(id)
    on delete set null;
exception
  when duplicate_object then null;
end $$;

create index if not exists support_tickets_assigned_to_admin_id_updated_at_idx
  on support_tickets (assigned_to_admin_id, updated_at desc);

create index if not exists support_tickets_sla_due_at_status_idx
  on support_tickets (sla_due_at, status);

create table if not exists support_ticket_internal_notes (
  id text primary key,
  ticket_id text not null references support_tickets(id) on delete cascade,
  actor_admin_id text references admin_users(id) on delete set null,
  note text not null,
  created_at timestamptz(6) not null default now(),
  updated_at timestamptz(6) not null default now()
);

create index if not exists support_ticket_internal_notes_ticket_id_created_at_idx
  on support_ticket_internal_notes (ticket_id, created_at desc);

create index if not exists support_ticket_internal_notes_actor_admin_id_created_at_idx
  on support_ticket_internal_notes (actor_admin_id, created_at desc);

update support_tickets ticket
   set assigned_to_admin_id = metadata->>'assignedAdminId'
 where assigned_to_admin_id is null
   and coalesce(metadata->>'assignedAdminId', '') <> ''
   and exists (
     select 1
       from admin_users admin
      where admin.id = metadata->>'assignedAdminId'
   );

update support_tickets
   set assigned_at =
     case
       when coalesce(metadata->>'assignedAt', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
         then (metadata->>'assignedAt')::timestamptz
       else null
     end
 where assigned_at is null
   and coalesce(metadata->>'assignedAt', '') <> '';

update support_tickets
   set sla_hours =
     case
       when coalesce(metadata->>'slaHours', '') ~ '^[0-9]+$'
         then (metadata->>'slaHours')::integer
       else null
     end
 where sla_hours is null
   and coalesce(metadata->>'slaHours', '') <> '';

update support_tickets
   set sla_due_at =
     case
       when coalesce(metadata->>'slaDueAt', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
         then (metadata->>'slaDueAt')::timestamptz
       else null
     end
 where sla_due_at is null
   and coalesce(metadata->>'slaDueAt', '') <> '';

with extracted_notes as (
  select ticket.id as ticket_id,
         note_text,
         btrim(
           case
             when note_text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+ '
               then substring(note_text from '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+ (.*)$')
             else note_text
           end
         ) as clean_note,
         case
           when note_text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+ '
             then substring(note_text from '^([0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+) ')::timestamptz
           else ticket.updated_at
         end as note_created_at
    from support_tickets ticket
         cross join lateral jsonb_array_elements_text(
           case
             when jsonb_typeof(coalesce(ticket.metadata::jsonb->'adminNotes', '[]'::jsonb)) = 'array'
               then coalesce(ticket.metadata::jsonb->'adminNotes', '[]'::jsonb)
             else '[]'::jsonb
           end
         ) as note_text
)
insert into support_ticket_internal_notes (
  id,
  ticket_id,
  actor_admin_id,
  note,
  created_at,
  updated_at
)
select 'support_note_' || md5(extracted_notes.ticket_id || ':' || extracted_notes.note_created_at::text || ':' || extracted_notes.clean_note),
       extracted_notes.ticket_id,
       null,
       extracted_notes.clean_note,
       extracted_notes.note_created_at,
       extracted_notes.note_created_at
  from extracted_notes
 where extracted_notes.clean_note <> ''
   and not exists (
     select 1
       from support_ticket_internal_notes existing
      where existing.ticket_id = extracted_notes.ticket_id
        and existing.note = extracted_notes.clean_note
   );
