-- ============================================================================
-- Contact photos: a public Storage bucket + a photo_url column on contacts.
-- Upload/replace/remove is editor/admin only; read is public — consistent
-- with the phonebook itself being public (migration 0006).
-- ============================================================================

alter table public.contacts
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contact-photos', 'contact-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists contact_photos_public_read on storage.objects;
create policy contact_photos_public_read on storage.objects
  for select to public
  using (bucket_id = 'contact-photos');

drop policy if exists contact_photos_staff_insert on storage.objects;
create policy contact_photos_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contact-photos' and public.is_editor_or_admin());

drop policy if exists contact_photos_staff_update on storage.objects;
create policy contact_photos_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'contact-photos' and public.is_editor_or_admin())
  with check (bucket_id = 'contact-photos' and public.is_editor_or_admin());

drop policy if exists contact_photos_staff_delete on storage.objects;
create policy contact_photos_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'contact-photos' and public.is_editor_or_admin());

-- Recreate the view to expose photo_url (must append at the end — see
-- note in 0007 about CREATE OR REPLACE VIEW column-order restrictions).
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
  c.search_text, c.phone_digits, c.rank_order, c.photo_url
from public.contacts c;
