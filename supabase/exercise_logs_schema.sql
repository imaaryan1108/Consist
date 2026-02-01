-- Enhanced Exercise Tracking Schema
-- Run this in Supabase SQL Editor to add detailed exercise logging

-- ============================================
-- EXERCISE LOGS TABLE
-- ============================================
create table public.exercise_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  
  -- Exercise details
  exercise_name text not null,
  sets int not null check (sets > 0),
  reps int not null check (reps > 0),
  weight_kg numeric(6,2) check (weight_kg >= 0),
  
  -- Optional
  rest_seconds int check (rest_seconds >= 0),
  notes text,
  
  created_at timestamp with time zone default now()
);

-- Indexes for efficient querying
create index exercise_logs_workout_id_idx on public.exercise_logs(workout_log_id);
create index exercise_logs_user_date_idx on public.exercise_logs(user_id, created_at desc);
create index exercise_logs_exercise_name_idx on public.exercise_logs(user_id, exercise_name);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.exercise_logs enable row level security;

-- Users can view their own exercise logs
create policy "Users can view their own exercise logs"
  on public.exercise_logs for select
  using (user_id = auth.uid());

-- Users can insert their own exercise logs
create policy "Users can insert their own exercise logs"
  on public.exercise_logs for insert
  with check (user_id = auth.uid());

-- Users can update their own exercise logs
create policy "Users can update their own exercise logs"
  on public.exercise_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own exercise logs
create policy "Users can delete their own exercise logs"
  on public.exercise_logs for delete
  using (user_id = auth.uid());

-- ============================================
-- UPDATE WORKOUT_LOGS TABLE
-- ============================================

-- Add column to track number of exercises in a workout
alter table public.workout_logs 
add column if not exists total_exercises int default 0;

-- Make workout_type and other fields nullable since details are in exercise_logs
alter table public.workout_logs 
alter column workout_type drop not null;

-- ============================================
-- HELPER FUNCTION: Update exercise count
-- ============================================
create or replace function update_workout_exercise_count()
returns trigger as $$
begin
  update public.workout_logs
  set total_exercises = (
    select count(*) 
    from public.exercise_logs 
    where workout_log_id = NEW.workout_log_id
  )
  where id = NEW.workout_log_id;
  
  return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-update exercise count
create trigger update_exercise_count_on_insert
  after insert on public.exercise_logs
  for each row
  execute function update_workout_exercise_count();

create trigger update_exercise_count_on_delete
  after delete on public.exercise_logs
  for each row
  execute function update_workout_exercise_count();

-- ============================================
-- REALTIME (if needed)
-- ============================================
alter publication supabase_realtime add table public.exercise_logs;
