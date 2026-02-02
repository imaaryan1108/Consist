-- ============================================
-- MACRO TRACKING MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor to add macro tracking support

-- 1. Add carbs and fats columns to meal_logs
alter table public.meal_logs 
  add column if not exists carbs_g numeric(5,1) check (carbs_g >= 0),
  add column if not exists fats_g numeric(5,1) check (fats_g >= 0);

-- 2. Add macro goal columns to targets table
alter table public.targets
  add column if not exists target_calories_daily int check (target_calories_daily > 0),
  add column if not exists target_protein_g_daily numeric(5,1) check (target_protein_g_daily >= 0),
  add column if not exists target_carbs_g_daily numeric(5,1) check (target_carbs_g_daily >= 0),
  add column if not exists target_fats_g_daily numeric(5,1) check (target_fats_g_daily >= 0);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked

-- Check meal_logs schema
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'meal_logs'
  and table_schema = 'public'
order by ordinal_position;

-- Check targets schema
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'targets'
  and table_schema = 'public'
order by ordinal_position;
