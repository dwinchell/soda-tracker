-- Applied to the "Soda Tracker" Supabase project as migration `soda_tracker_v1_schema` (2026-10-16).
-- The old, empty `soda_consumption` table from the aborted first attempt is left in place (unused).

create table public.soda_entries (
  id          bigint generated always as identity primary key,
  client_id   uuid not null unique default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date    date not null,
  drank_at    timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index soda_entries_log_date_idx on public.soda_entries (log_date);

create table public.goals (
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  effective_from  date not null,
  daily_limit     integer not null check (daily_limit >= 0 and daily_limit <= 50),
  created_at      timestamptz not null default now(),
  primary key (user_id, effective_from)
);

create table public.cheat_days (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day         date not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, day)
);
-- At most one cheat day per Monday-Sunday week.
create unique index cheat_days_one_per_week
  on public.cheat_days (user_id, (date_trunc('week', day::timestamp)));

alter table public.soda_entries enable row level security;
alter table public.goals        enable row level security;
alter table public.cheat_days   enable row level security;

create policy "own rows" on public.soda_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.cheat_days for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.soda_entries, public.goals, public.cheat_days from anon;
grant select, insert, update, delete on public.soda_entries, public.goals, public.cheat_days to authenticated;
grant usage, select on all sequences in schema public to authenticated;
