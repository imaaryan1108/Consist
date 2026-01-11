-- ============================================================
-- FIX: Join Circle by Code (RLS Bypass)
-- ============================================================
-- Problem: RLS prevents users from "seeing" a circle they haven't joined yet.
-- But to join it, they need to find it by code first!
--
-- Solution: Create a secure function that allows looking up a circle
-- strictly by its unique code, bypassing RLS safely.

-- 1. Create the secure lookup function
create or replace function get_circle_by_code(lookup_code text)
returns setof public.circles
language sql
security definer -- <--- This allows bypassing RLS
set search_path = public
stable
as $$
  select * from public.circles 
  where code = upper(lookup_code) -- Case insensitive match
  limit 1;
$$;
