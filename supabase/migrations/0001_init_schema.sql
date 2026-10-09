-- ============================================================================
-- Organization Phonebook — Initial Schema
-- ============================================================================
-- Extensions
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- trigram search (partial/Thai substring match)

-- ============================================================================
-- Enums
-- ============================================================================
do $$ begin
  create type user_role as enum ('admin', 'editor', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type mobile_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type audit_action as enum (
    'contact_create', 'contact_update', 'contact_deactivate', 'contact_reactivate',
    'contact_import',
    'profile_role_change', 'profile_activate', 'profile_deactivate',
    'department_create', 'department_update', 'department_delete'
  );
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- departments
-- ============================================================================
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.departments(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_name_not_blank check (btrim(name) <> '')
);

create index if not exists idx_departments_parent_id on public.departments(parent_id);

-- ============================================================================
-- profiles  (1:1 extension of auth.users)
-- ============================================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role user_role not null default 'viewer',
  department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (btrim(display_name) <> '')
);

create index if not exists idx_profiles_department_id on public.profiles(department_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================================================
-- contacts
-- ============================================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  prefix text,
  first_name text not null,
  last_name text not null,
  nickname text,
  rank text,
  position text,
  department_id uuid references public.departments(id) on delete set null,
  mobile_phone text,
  mobile_visibility mobile_visibility not null default 'public',
  office_phone text,
  extension text,
  email text,
  work_location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  constraint contacts_name_not_blank check (btrim(first_name) <> '' and btrim(last_name) <> ''),
  constraint contacts_email_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint contacts_mobile_format check (mobile_phone is null or mobile_phone ~ '^[0-9+\-\s()]{6,20}$'),
  constraint contacts_office_format check (office_phone is null or office_phone ~ '^[0-9+\-\s()]{6,20}$'),
  constraint contacts_extension_format check (extension is null or extension ~ '^[0-9\-]{1,10}$')
);

-- Generated search column: lowercased concatenation of searchable text fields
-- (name, nickname, rank, position; department name is joined separately).
alter table public.contacts
  add column if not exists search_text text
  generated always as (
    lower(
      coalesce(prefix, '') || ' ' ||
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(nickname, '') || ' ' ||
      coalesce(rank, '') || ' ' ||
      coalesce(position, '')
    )
  ) stored;

-- Generated digits-only column for phone number search (strips formatting).
alter table public.contacts
  add column if not exists phone_digits text
  generated always as (
    regexp_replace(
      coalesce(mobile_phone, '') || ' ' || coalesce(office_phone, '') || ' ' || coalesce(extension, ''),
      '[^0-9]', '', 'g'
    )
  ) stored;

create index if not exists idx_contacts_search_text_trgm on public.contacts using gin (search_text gin_trgm_ops);
create index if not exists idx_contacts_phone_digits_trgm on public.contacts using gin (phone_digits gin_trgm_ops);
create index if not exists idx_contacts_department_id on public.contacts(department_id);
create index if not exists idx_contacts_is_active on public.contacts(is_active);
create index if not exists idx_contacts_email_lower on public.contacts (lower(email));

-- Case-insensitive duplicate detection: same first+last name OR same mobile number.
create index if not exists idx_contacts_dup_name on public.contacts (lower(first_name), lower(last_name));

-- ============================================================================
-- favorites
-- ============================================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_unique unique (user_id, contact_id)
);

create index if not exists idx_favorites_user_id on public.favorites(user_id);

-- ============================================================================
-- audit_logs  (append-only; no update/delete allowed — see RLS)
-- ============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action audit_action not null,
  record_type text not null,
  record_id uuid,
  changed_fields jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_record on public.audit_logs(record_type, record_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up (role defaults to
-- 'viewer' and is_active defaults to false — an admin must activate + assign
-- a role explicitly; this prevents silent self-service access).
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'viewer',
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
