-- ============================================================================
-- Organization Phonebook — Permission helper functions + trusted audit log
-- triggers. Audit rows are written ONLY by these SECURITY DEFINER triggers,
-- never directly by client code, so no app role can forge or skip history.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Permission helpers (SECURITY DEFINER so they can read `profiles` even
-- though `profiles` itself has RLS enabled — avoids policy recursion).
-- ----------------------------------------------------------------------------
create or replace function public.current_profile()
returns public.profiles
language sql
security definer
stable
set search_path = public
as $$
  select * from public.profiles where user_id = auth.uid();
$$;

create or replace function public.current_role_name()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

create or replace function public.current_is_active()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_active from public.profiles where user_id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role in ('admin', 'editor') and is_active = true
  );
$$;

-- An editor may write a contact only within their own department (or if the
-- contact has no department yet); admins may write any contact.
create or replace function public.can_edit_contact_department(target_department_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    case
      when public.is_admin() then true
      when public.is_editor_or_admin() then
        target_department_id is null
        or target_department_id = (select department_id from public.profiles where user_id = auth.uid())
      else false
    end;
$$;

-- Recursive department + all descendant ids (used by department/sub-unit filter).
create or replace function public.department_and_descendants(dept_id uuid)
returns table (id uuid)
language sql
stable
set search_path = public
as $$
  with recursive d as (
    select id from public.departments where id = dept_id
    union all
    select c.id from public.departments c join d on c.parent_id = d.id
  )
  select id from d;
$$;

-- ----------------------------------------------------------------------------
-- Masked, RLS-respecting read view for contacts. mobile_phone is nulled out
-- for viewers when the contact marks it 'private'; editors/admins always see
-- the real number. security_invoker keeps the underlying table's RLS policies
-- (is_active, etc.) in effect for whoever queries this view.
-- ----------------------------------------------------------------------------
create or replace view public.contacts_view
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
  c.search_text, c.phone_digits
from public.contacts c;

-- ----------------------------------------------------------------------------
-- Generic jsonb diff: { field: { old: ..., new: ... } } for changed keys only.
-- ----------------------------------------------------------------------------
create or replace function public.jsonb_diff(old_row jsonb, new_row jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb := '{}'::jsonb;
  k text;
begin
  for k in select jsonb_object_keys(new_row)
  loop
    if old_row -> k is distinct from new_row -> k then
      result := result || jsonb_build_object(k, jsonb_build_object('old', old_row -> k, 'new', new_row -> k));
    end if;
  end loop;
  return result;
end;
$$;

-- ----------------------------------------------------------------------------
-- audit: contacts
-- ----------------------------------------------------------------------------
create or replace function public.audit_contacts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  act audit_action;
  diff jsonb;
begin
  if tg_op = 'INSERT' then
    act := 'contact_create';
    diff := to_jsonb(new) - 'search_text' - 'phone_digits';
    insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
    values (auth.uid(), act, 'contact', new.id, diff);
  elsif tg_op = 'UPDATE' then
    diff := public.jsonb_diff(
      (to_jsonb(old) - 'search_text' - 'phone_digits'),
      (to_jsonb(new) - 'search_text' - 'phone_digits')
    );
    if diff = '{}'::jsonb then
      return new;
    end if;
    if old.is_active = true and new.is_active = false then
      act := 'contact_deactivate';
    elsif old.is_active = false and new.is_active = true then
      act := 'contact_reactivate';
    else
      act := 'contact_update';
    end if;
    insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
    values (auth.uid(), act, 'contact', new.id, diff);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_contacts on public.contacts;
create trigger trg_audit_contacts
  after insert or update on public.contacts
  for each row execute function public.audit_contacts();

-- ----------------------------------------------------------------------------
-- audit: profiles (role changes / activation toggles)
-- ----------------------------------------------------------------------------
create or replace function public.audit_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  diff jsonb;
begin
  if tg_op = 'UPDATE' then
    diff := public.jsonb_diff(to_jsonb(old), to_jsonb(new));
    if diff = '{}'::jsonb then
      return new;
    end if;
    if old.role is distinct from new.role then
      insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
      values (auth.uid(), 'profile_role_change', 'profile', new.user_id, diff);
    end if;
    if old.is_active is distinct from new.is_active then
      insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
      values (
        auth.uid(),
        case when new.is_active then 'profile_activate'::audit_action else 'profile_deactivate'::audit_action end,
        'profile', new.user_id, diff
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after update on public.profiles
  for each row execute function public.audit_profiles();

-- ----------------------------------------------------------------------------
-- audit: departments
-- ----------------------------------------------------------------------------
create or replace function public.audit_departments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  diff jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
    values (auth.uid(), 'department_create', 'department', new.id, to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    diff := public.jsonb_diff(to_jsonb(old), to_jsonb(new));
    if diff <> '{}'::jsonb then
      insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
      values (auth.uid(), 'department_update', 'department', new.id, diff);
    end if;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
    values (auth.uid(), 'department_delete', 'department', old.id, to_jsonb(old));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_departments on public.departments;
create trigger trg_audit_departments
  after insert or update or delete on public.departments
  for each row execute function public.audit_departments();
