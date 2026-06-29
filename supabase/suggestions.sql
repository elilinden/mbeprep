create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  type text not null default 'General feedback',
  page text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

create policy "Users can create their own suggestions"
on public.suggestions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read their own suggestions"
on public.suggestions
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists suggestions_created_at_idx
on public.suggestions (created_at desc);

create index if not exists suggestions_user_id_idx
on public.suggestions (user_id);
