-- ============================================================================
-- Defense in depth: created_by/updated_by must always be the acting user,
-- never a client-supplied value (even though the Next.js server actions
-- already set these explicitly server-side before writing).
-- ============================================================================
create or replace function public.set_contact_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_contacts_actor on public.contacts;
create trigger trg_contacts_actor
  before insert or update on public.contacts
  for each row execute function public.set_contact_actor();
