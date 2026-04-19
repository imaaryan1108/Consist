-- Push Subscriptions Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================
create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  -- Full Web Push subscription object from browser (endpoint + keys)
  subscription jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- One subscription per user (upsert on conflict)
  unique(user_id)
);

-- Index for fast lookups by user
create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- Auto-update updated_at
create trigger update_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row
  execute function update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.push_subscriptions enable row level security;

-- Users can only read/write their own subscription
create policy "Users can manage their own push subscription"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role (used by Edge Functions / API routes) bypasses RLS automatically
-- No extra policy needed for service role reads
