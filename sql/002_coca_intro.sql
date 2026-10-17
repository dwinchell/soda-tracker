-- Applied to the "Soda Tracker" Supabase project as migration `coca_intro_table` (2026-10-16).
-- One row per user who has met Coca (accepted the intro). No row = show the intro on next sign-in.
create table public.coca_intro (
  user_id  uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  met_at   timestamptz not null default now()
);

alter table public.coca_intro enable row level security;
create policy "own rows" on public.coca_intro for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.coca_intro from anon;
grant select, insert, update, delete on public.coca_intro to authenticated;

-- To show someone the intro again (e.g. for testing): delete from public.coca_intro where user_id = '<id>';
