-- Persist AI action plans per diary entry
alter table if exists diary_entries
  add column if not exists action_plan jsonb;

