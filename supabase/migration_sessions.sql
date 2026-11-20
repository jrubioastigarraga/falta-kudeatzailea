-- Migration: date-specific schedule sessions, challenge notes, late status
alter table public.challenges add column if not exists notes text;

alter table public.absences drop constraint if exists absences_status_check;
alter table public.absences
  add constraint absences_status_check check (status in ('justified', 'unjustified', 'late'));

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  date date not null,
  hour integer not null check (hour between 8 and 14),
  module_id uuid not null references public.modules (id) on delete cascade,
  unique (course_id, date, hour)
);

create index if not exists sessions_course_date_idx on public.sessions (course_id, date);

alter table public.sessions enable row level security;

drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions
  for select to authenticated using (true);

drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.sessions to authenticated;
grant all on public.sessions to service_role;
