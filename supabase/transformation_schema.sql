-- Consist Transformation Features Schema
-- Run this in your Supabase SQL Editor to add new tables

-- ============================================
-- BODY PROFILES TABLE
-- ============================================
create table public.body_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  
  -- Core measurements
  height_cm numeric(5,2) not null check (height_cm > 0),
  current_weight_kg numeric(5,2) not null check (current_weight_kg > 0),
  
  -- Optional measurements
  waist_cm numeric(5,2) check (waist_cm > 0),
  chest_cm numeric(5,2) check (chest_cm > 0),
  arms_cm numeric(5,2) check (arms_cm > 0),
  
  -- Preferences
  unit_preference text default 'metric' check (unit_preference in ('metric', 'imperial')),
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for user lookups
create index body_profiles_user_id_idx on public.body_profiles(user_id);

-- ============================================
-- TARGETS TABLE
-- ============================================
create table public.targets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  
  -- Target definition
  target_weight_kg numeric(5,2) not null check (target_weight_kg > 0),
  target_date date not null,
  
  -- Starting point (captured when target is set)
  starting_weight_kg numeric(5,2) not null check (starting_weight_kg > 0),
  starting_date date not null default current_date,
  
  -- Motivational copy
  custom_message text,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for user lookups
create index targets_user_id_idx on public.targets(user_id);

-- ============================================
-- MEAL LOGS TABLE
-- ============================================
create table public.meal_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Meal data
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null,
  calories numeric(6,1) not null check (calories >= 0),
  
  -- Optional nutrition
  protein_g numeric(5,1) check (protein_g >= 0),
  water_ml numeric(6,0) check (water_ml >= 0),
  
  created_at timestamp with time zone default now()
);

-- Indexes for querying
create index meal_logs_user_date_idx on public.meal_logs(user_id, date desc);

-- ============================================
-- WORKOUT LOGS TABLE
-- ============================================
create table public.workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Workout data
  date date not null,
  workout_type text not null check (workout_type in ('gym', 'walk', 'cardio', 'rest', 'other')),
  duration_minutes numeric(5,0) check (duration_minutes >= 0),
  
  -- Optional details
  muscle_group text,
  notes text,
  
  created_at timestamp with time zone default now(),
  
  -- One workout per day
  unique(user_id, date)
);

-- Index for user history
create index workout_logs_user_date_idx on public.workout_logs(user_id, date desc);

-- ============================================
-- WEEKLY CHECKINS TABLE
-- ============================================
create table public.weekly_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Check-in data
  week_start_date date not null,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  
  -- Optional measurements
  waist_cm numeric(5,2) check (waist_cm > 0),
  chest_cm numeric(5,2) check (chest_cm > 0),
  arms_cm numeric(5,2) check (arms_cm > 0),
  
  -- Calculated changes (vs previous week)
  weight_change_kg numeric(5,2),
  
  created_at timestamp with time zone default now(),
  
  -- One check-in per user per week
  unique(user_id, week_start_date)
);

-- Index for user history
create index weekly_checkins_user_week_idx on public.weekly_checkins(user_id, week_start_date desc);

-- ============================================
-- MILESTONES TABLE
-- ============================================
create table public.milestones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Milestone type
  type text not null check (type in (
    'weight_milestone',
    'weekly_completion',
    'monthly_consistency',
    'target_achieved'
  )),
  
  -- Milestone data
  title text not null,
  description text,
  icon text default '🏆',
  
  -- Rewards
  bonus_points int default 0 check (bonus_points >= 0),
  
  -- Metadata (flexible JSON for specific milestone data)
  metadata jsonb,
  
  created_at timestamp with time zone default now()
);

-- Index for user milestone history
create index milestones_user_created_idx on public.milestones(user_id, created_at desc);
create index milestones_type_idx on public.milestones(type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all new tables
alter table public.body_profiles enable row level security;
alter table public.targets enable row level security;
alter table public.meal_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.milestones enable row level security;

-- BODY_PROFILES: Users can only access their own profile
create policy "Users can view their own body profile"
  on public.body_profiles for select
  using (user_id = auth.uid());

create policy "Users can insert their own body profile"
  on public.body_profiles for insert
  with check (user_id = auth.uid());

create policy "Users can update their own body profile"
  on public.body_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- TARGETS: Users can only access their own target
create policy "Users can view their own target"
  on public.targets for select
  using (user_id = auth.uid());

create policy "Users can insert their own target"
  on public.targets for insert
  with check (user_id = auth.uid());

create policy "Users can update their own target"
  on public.targets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- MEAL_LOGS: Private - only user can see their own meals
create policy "Users can view their own meal logs"
  on public.meal_logs for select
  using (user_id = auth.uid());

create policy "Users can insert their own meal logs"
  on public.meal_logs for insert
  with check (user_id = auth.uid());

create policy "Users can update their own meal logs"
  on public.meal_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own meal logs"
  on public.meal_logs for delete
  using (user_id = auth.uid());

-- WORKOUT_LOGS: Private - only user can see their own workouts
create policy "Users can view their own workout logs"
  on public.workout_logs for select
  using (user_id = auth.uid());

create policy "Users can insert their own workout logs"
  on public.workout_logs for insert
  with check (user_id = auth.uid());

create policy "Users can update their own workout logs"
  on public.workout_logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own workout logs"
  on public.workout_logs for delete
  using (user_id = auth.uid());

-- WEEKLY_CHECKINS: Private - only user can see their check-ins
create policy "Users can view their own weekly check-ins"
  on public.weekly_checkins for select
  using (user_id = auth.uid());

create policy "Users can insert their own weekly check-ins"
  on public.weekly_checkins for insert
  with check (user_id = auth.uid());

-- MILESTONES: Users can view their own milestones
create policy "Users can view their own milestones"
  on public.milestones for select
  using (user_id = auth.uid());

create policy "Users can create their own milestones"
  on public.milestones for insert
  with check (user_id = auth.uid());

-- ============================================
-- UPDATE EXISTING ACTIVITIES TABLE
-- ============================================

-- Drop existing constraint
alter table public.activities drop constraint if exists activities_type_check;

-- Add new constraint with extended types
alter table public.activities add constraint activities_type_check 
  check (type in (
    'consisted', 
    'streak_milestone', 
    'push_sent', 
    'consisted_after_push', 
    'streak_broken',
    'logged_meals',
    'logged_workout',
    'weight_milestone',
    'weekly_checkin',
    'target_achieved'
  ));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at on body_profiles
create trigger update_body_profiles_updated_at
  before update on public.body_profiles
  for each row
  execute function update_updated_at_column();

-- Function to auto-update updated_at on targets
create trigger update_targets_updated_at
  before update on public.targets
  for each row
  execute function update_updated_at_column();

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Enable realtime for new tables that need live updates
alter publication supabase_realtime add table public.milestones;
alter publication supabase_realtime add table public.weekly_checkins;

-- ============================================
-- TRANSFORMATION SCHEMA COMPLETE
-- ============================================
-- You can now use these tables to track body profiles, targets,
-- meals, workouts, weekly check-ins, and milestones
