-- ============================================================================
-- Public, unauthenticated read access to the phonebook (browsing only).
--
-- Decision: the directory itself (search + contact detail) is now public —
-- no login required to look someone up. Everything else (favorites, adding/
-- editing/deactivating contacts, admin) still requires an authenticated
-- session with the appropriate role; those policies are unchanged.
--
-- Mobile numbers marked mobile_visibility = 'private' stay hidden from the
-- anon role too: contacts_view's masking CASE calls is_editor_or_admin(),
-- which requires an active profile row and is false for anon by construction.
-- ============================================================================

drop policy if exists contacts_select_public on public.contacts;
create policy contacts_select_public on public.contacts
  for select to anon
  using (is_active = true);

drop policy if exists departments_select_public on public.departments;
create policy departments_select_public on public.departments
  for select to anon
  using (true);
