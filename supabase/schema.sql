-- Consist MVP Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CIRCLES TABLE
-- ============================================
create table public.circles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);

-- Index for fast code lookups when joining
create index circles_code_idx on public.circles(code);

-- ============================================
-- USERS TABLE (extends auth.users)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  circle_id uuid references public.circles(id) on delete set null,
  current_streak int default 0 check (current_streak >= 0),
  longest_streak int default 0 check (longest_streak >= 0),
  total_days int default 0 check (total_days >= 0),
  score int default 0 check (score >= 0),
  last_consist_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fast circle member queries
create index users_circle_id_idx on public.users(circle_id);

-- ============================================
-- CONSIST LOGS TABLE
-- ============================================
create table public.consist_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  created_at timestamp with time zone default now(),
  
  -- Ensure one consist per user per day
  unique(user_id, date)
);

-- Index for fast user history queries (most recent first)
create index consist_logs_user_date_idx on public.consist_logs(user_id, date desc);

-- ============================================
-- PUSHES TABLE
-- ============================================
create table public.pushes (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references public.users(id) on delete cascade not null,
  to_user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  created_at timestamp with time zone default now(),
  
  -- Prevent self-pushes
  check (from_user_id != to_user_id)
);

-- Index for checking daily push limits
create index pushes_from_user_date_idx on public.pushes(from_user_id, date);
-- Index for checking who pushed a user
create index pushes_to_user_date_idx on public.pushes(to_user_id, date);

-- ============================================
-- ACTIVITIES TABLE (Feed)
-- ============================================
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('consisted', 'streak_milestone', 'push_sent', 'consisted_after_push', 'streak_broken')),
  actor_id uuid references public.users(id) on delete cascade not null,
  target_id uuid references public.users(id) on delete cascade,
  circle_id uuid references public.circles(id) on delete cascade not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Index for fast circle activity feed queries (most recent first)
create index activities_circle_created_idx on public.activities(circle_id, created_at desc);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
alter table public.circles enable row level security;
alter table public.users enable row level security;
alter table public.consist_logs enable row level security;
alter table public.pushes enable row level security;
alter table public.activities enable row level security;

-- CIRCLES: Users can only see their own circle
create policy "Users can view their own circle"
  on public.circles for select
  using (
    id in (
      select circle_id from public.users where id = auth.uid()
    )
  );

create policy "Users can create circles"
  on public.circles for insert
  with check (created_by = auth.uid());

-- USERS: Users can see members of their circle
create policy "Users can view circle members"
  on public.users for select
  using (
    circle_id in (
      select circle_id from public.users where id = auth.uid()
    )
    or id = auth.uid()
  );

create policy "Users can insert their own profile"
  on public.users for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- CONSIST_LOGS: Users can see logs from their circle
create policy "Users can view circle consist logs"
  on public.consist_logs for select
  using (
    user_id in (
      select id from public.users 
      where circle_id = (
        select circle_id from public.users where id = auth.uid()
      )
    )
  );

create policy "Users can insert their own consist logs"
  on public.consist_logs for insert
  with check (user_id = auth.uid());

-- PUSHES: Users can see pushes in their circle
create policy "Users can view circle pushes"
  on public.pushes for select
  using (
    from_user_id in (
      select id from public.users 
      where circle_id = (
        select circle_id from public.users where id = auth.uid()
      )
    )
  );

create policy "Users can create pushes to circle members"
  on public.pushes for insert
  with check (
    from_user_id = auth.uid()
    and to_user_id in (
      select id from public.users 
      where circle_id = (
        select circle_id from public.users where id = auth.uid()
      )
    )
  );

-- ACTIVITIES: Users can view activities from their circle
create policy "Users can view circle activities"
  on public.activities for select
  using (
    circle_id in (
      select circle_id from public.users where id = auth.uid()
    )
  );

create policy "Users can create activities for their circle"
  on public.activities for insert
  with check (
    actor_id = auth.uid()
    and circle_id = (
      select circle_id from public.users where id = auth.uid()
    )
  );

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Enable realtime for tables that need live updates
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.consist_logs;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate unique 6-character circle codes
create or replace function generate_circle_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude ambiguous chars
  result text := '';
  i int;
  code_exists boolean := true;
begin
  while code_exists loop
    result := '';
    for i in 1..6 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    
    -- Check if code already exists
    select exists(select 1 from public.circles where code = result) into code_exists;
  end loop;
  
  return result;
end;
$$ language plpgsql;

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on users table
create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function update_updated_at_column();

-- ============================================
-- INITIAL SETUP COMPLETE
-- ============================================
-- You can now use these tables with Row Level Security enabled
-- Users will only see data from their own circle
