create table if not exists public.user_progress_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_key text not null,
  question_id text not null,
  selected_choice text not null,
  correct_choice text not null,
  is_correct boolean not null,
  subject text not null,
  category text not null,
  subtopic text not null,
  difficulty text not null,
  attempted_at timestamptz not null,
  time_spent integer not null default 0,
  guessed boolean not null default false,
  marked_confusing boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, attempt_key)
);

create table if not exists public.question_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  attempts integer not null default 0,
  correct integer not null default 0,
  incorrect integer not null default 0,
  saved_for_review boolean not null default false,
  guessed integer not null default 0,
  confusing integer not null default 0,
  total_time integer not null default 0,
  last_attempt_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.weakness_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id text not null,
  subject text not null,
  category text not null,
  subtopic text not null,
  score integer not null default 0,
  missed integer not null default 0,
  guessed integer not null default 0,
  confusing integer not null default 0,
  slow integer not null default 0,
  correct_recovery integer not null default 0,
  reason text not null default '',
  question_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, area_id)
);

create table if not exists public.flashcard_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  attempts integer not null default 0,
  got_it integer not null default 0,
  needs_work integer not null default 0,
  last_rating text not null check (last_rating in ('got-it', 'needs-work')),
  last_reviewed_at timestamptz not null,
  ease_factor numeric not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.flashcard_progress
  add column if not exists ease_factor numeric not null default 2.5,
  add column if not exists interval_days integer not null default 0,
  add column if not exists repetitions integer not null default 0,
  add column if not exists lapses integer not null default 0,
  add column if not exists next_review_at timestamptz;

create table if not exists public.podcast_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create table if not exists public.podcast_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

alter table public.user_progress_snapshots enable row level security;
alter table public.question_attempts enable row level security;
alter table public.question_stats enable row level security;
alter table public.saved_questions enable row level security;
alter table public.weakness_scores enable row level security;
alter table public.flashcard_progress enable row level security;
alter table public.podcast_notes enable row level security;
alter table public.podcast_bookmarks enable row level security;

create policy "Users manage own progress snapshots"
on public.user_progress_snapshots
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own question attempts"
on public.question_attempts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own question stats"
on public.question_stats
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own saved questions"
on public.saved_questions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own weakness scores"
on public.weakness_scores
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own flashcard progress"
on public.flashcard_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own podcast notes"
on public.podcast_notes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own podcast bookmarks"
on public.podcast_bookmarks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists question_attempts_user_attempted_at_idx
on public.question_attempts (user_id, attempted_at desc);

create index if not exists question_attempts_question_id_idx
on public.question_attempts (question_id);

create index if not exists weakness_scores_user_score_idx
on public.weakness_scores (user_id, score desc);

create index if not exists flashcard_progress_user_reviewed_idx
on public.flashcard_progress (user_id, last_reviewed_at desc);

create index if not exists podcast_notes_user_updated_idx
on public.podcast_notes (user_id, updated_at desc);
