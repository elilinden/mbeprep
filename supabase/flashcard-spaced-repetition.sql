alter table public.flashcard_progress
  add column if not exists ease_factor numeric not null default 2.5,
  add column if not exists interval_days integer not null default 0,
  add column if not exists repetitions integer not null default 0,
  add column if not exists lapses integer not null default 0,
  add column if not exists next_review_at timestamptz;
