-- ============================================================================
-- RPC to record a single summary audit row for a bulk CSV import. Audit
-- rows otherwise come only from trusted triggers; this is the one
-- deliberate, narrowly-scoped exception (editor/admin only, fixed action).
-- ============================================================================
create or replace function public.log_contact_import(summary jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_editor_or_admin() then
    raise exception 'insufficient_privilege';
  end if;

  insert into public.audit_logs (actor_id, action, record_type, record_id, changed_fields)
  values (auth.uid(), 'contact_import', 'import', null, summary);
end;
$$;

revoke all on function public.log_contact_import(jsonb) from public;
grant execute on function public.log_contact_import(jsonb) to authenticated;
