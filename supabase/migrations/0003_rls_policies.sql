-- ============================================================================
-- Organization Phonebook — Row Level Security
-- All tables default-deny; every allowed operation is an explicit policy.
-- ============================================================================

alter table public.departments enable row level security;
alter table public.profiles    enable row level security;
alter table public.contacts    enable row level security;
alter table public.favorites   enable row level security;
alter table public.audit_logs  enable row level security;

-- ----------------------------------------------------------------------------
-- departments
-- ----------------------------------------------------------------------------
drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments
  for select to authenticated
  using (public.current_is_active());

drop policy if exists departments_insert on public.departments;
create policy departments_insert on public.departments
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists departments_update on public.departments;
create policy departments_update on public.departments
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists departments_delete on public.departments;
create policy departments_delete on public.departments
  for delete to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only admins change role / is_active / department_id / display_name of an
-- account. (A user cannot elevate their own role: this policy has no
-- "self" branch at all for writes.)
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles rows are created automatically by the handle_new_auth_user
-- trigger (security definer) — no direct client INSERT/DELETE policy exists,
-- so client-side inserts/deletes are always denied.

-- ----------------------------------------------------------------------------
-- contacts  (writes go through the base table; reads should prefer
-- contacts_view for mobile-number masking, but base-table SELECT is also
-- scoped correctly for direct queries by editors/admins in management UI)
-- ----------------------------------------------------------------------------
drop policy if exists contacts_select on public.contacts;
create policy contacts_select on public.contacts
  for select to authenticated
  using (
    public.current_is_active()
    and (is_active = true or public.is_editor_or_admin())
  );

drop policy if exists contacts_insert on public.contacts;
create policy contacts_insert on public.contacts
  for insert to authenticated
  with check (
    public.is_editor_or_admin()
    and public.can_edit_contact_department(department_id)
  );

drop policy if exists contacts_update on public.contacts;
create policy contacts_update on public.contacts
  for update to authenticated
  using (
    public.is_editor_or_admin()
    and public.can_edit_contact_department(department_id)
  )
  with check (
    public.is_editor_or_admin()
    and public.can_edit_contact_department(department_id)
  );

-- No delete policy: contacts are soft-deleted via is_active, never hard
-- deleted, so DELETE is denied for every client role.

-- ----------------------------------------------------------------------------
-- favorites  (strictly private to the owning user)
-- ----------------------------------------------------------------------------
drop policy if exists favorites_select on public.favorites;
create policy favorites_select on public.favorites
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid() and public.current_is_active());

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites
  for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- audit_logs  (admin read-only; no client write/update/delete policy at all
-- — rows are inserted exclusively by the SECURITY DEFINER audit triggers)
-- ----------------------------------------------------------------------------
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_admin());
