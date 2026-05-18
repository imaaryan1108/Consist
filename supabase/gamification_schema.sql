-- Gamification Schema
-- Run in Supabase SQL Editor

-- ============================================
-- USER TITLES TABLE
-- ============================================
create table public.user_titles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title_key text not null,        -- e.g. 'anchor', 'ghost', 'machine'
  earned_at timestamp with time zone default now(),
  is_active boolean default false,
  unique(user_id, title_key)
);

create index user_titles_user_id_idx on public.user_titles(user_id);

-- RLS
alter table public.user_titles enable row level security;

create policy "Users can view titles of circle members"
  on public.user_titles for select
  using (
    user_id in (
      select id from public.users
      where circle_id = (select circle_id from public.users where id = auth.uid())
    )
    or user_id = auth.uid()
  );

create policy "Users can manage their own titles"
  on public.user_titles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- CIRCLE CHAPTERS TABLE
-- ============================================
create table public.circle_chapters (
  id uuid primary key default uuid_generate_v4(),
  circle_id uuid references public.circles(id) on delete cascade not null,
  chapter_number int not null,         -- 1, 2, 3, 4
  chapter_name text not null,          -- 'The Awakening', etc.
  started_at date not null,
  completed_at timestamp with time zone,
  punch_in_rate numeric(5,2),          -- e.g. 82.5
  is_complete boolean default false,
  unique(circle_id, chapter_number)
);

create index circle_chapters_circle_id_idx on public.circle_chapters(circle_id);

-- RLS
alter table public.circle_chapters enable row level security;

create policy "Users can view their circle's chapters"
  on public.circle_chapters for select
  using (
    circle_id = (select circle_id from public.users where id = auth.uid())
  );

-- Add to realtime
alter publication supabase_realtime add table public.user_titles;
alter publication supabase_realtime add table public.circle_chapters;
