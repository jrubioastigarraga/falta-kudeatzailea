-- ===========================================================================
-- Falta Kudeatzailea · Supabase schema
-- Run this file in the Supabase SQL Editor (or with `supabase db push`).
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('admin', 'student')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  position integer not null default 1
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  date date not null,
  name text not null,
  unique (course_id, date)
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  name text not null,
  code text,
  color text default '#4e73df'
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete set null,
  name text not null,
  start_date date not null,
  end_date date not null
);

create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  weekday integer not null check (weekday between 1 and 7),
  hour integer not null check (hour between 8 and 14),
  module_id uuid not null references public.modules (id) on delete cascade,
  unique (course_id, weekday, hour)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  unique (course_id, student_id)
);

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  hour integer not null check (hour between 8 and 14),
  module_id uuid not null references public.modules (id) on delete cascade,
  status text not null check (status in ('justified', 'unjustified')),
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date, hour)
);

create index if not exists absences_student_idx on public.absences (student_id, date);
create index if not exists absences_course_idx on public.absences (course_id, date);
create index if not exists timetable_course_idx on public.timetable (course_id);

-- ---------------------------------------------------------------------------
-- Helper: is the current user an active admin?
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active
  );
$$;

-- ---------------------------------------------------------------------------
-- Create a profile automatically when a user signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.evaluations enable row level security;
alter table public.holidays enable row level security;
alter table public.modules enable row level security;
alter table public.challenges enable row level security;
alter table public.timetable enable row level security;
alter table public.enrollments enable row level security;
alter table public.absences enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- reference data: everyone authenticated reads, only admins write
do $$
declare
  t text;
begin
  foreach t in array array['courses', 'evaluations', 'holidays', 'modules', 'challenges', 'timetable']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to authenticated using (true)',
      t, t
    );
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end;
$$;

-- enrollments: students read their own, admins manage
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists enrollments_write on public.enrollments;
create policy enrollments_write on public.enrollments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- absences: students read their own, admins manage
drop policy if exists absences_select on public.absences;
create policy absences_select on public.absences
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists absences_write on public.absences;
create policy absences_write on public.absences
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.is_admin() to authenticated;
