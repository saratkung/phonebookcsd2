-- ============================================================================
-- Optional display-ordering hint for contacts within the same department —
-- e.g. a police unit wants ผกก (commander) listed before รอง ผกก (deputy)
-- before สว (inspector), rather than alphabetical by last name. Lower
-- number sorts first; null sorts last (falls back to alphabetical order).
-- ============================================================================
alter table public.contacts
  add column if not exists rank_order integer;

comment on column public.contacts.rank_order is
  'Optional manual sort key for seniority/rank ordering within a department. Lower = displayed first. Null = sorts after all ranked contacts, alphabetically.';

-- contacts_view must be recreated (not just altered) to expose the new
-- column — this must run after the column exists, so it lives here rather
-- than in 0002 (which runs before this file on a fresh install).
drop view if exists public.contacts_view;
create view public.contacts_view
with (security_invoker = true)
as
select
  c.id, c.prefix, c.first_name, c.last_name, c.nickname, c.rank, c.position,
  c.department_id,
  case
    when c.mobile_visibility = 'public' or public.is_editor_or_admin() then c.mobile_phone
    else null
  end as mobile_phone,
  c.mobile_visibility,
  c.office_phone, c.extension, c.email, c.work_location, c.notes,
  c.is_active, c.created_at, c.updated_at, c.created_by, c.updated_by,
  c.search_text, c.phone_digits, c.rank_order
from public.contacts c;
