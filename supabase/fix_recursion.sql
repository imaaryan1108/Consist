-- ============================================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================================
-- The error "infinite recursion detected" happens because the RLS policy
-- checks "users" table, which tries to read "users" table again to check the circle_id,
-- creating an infinite loop.

-- SOLUTION: Use a security definer function to read the circle_id safely.
-- Security definer functions bypass RLS, breaking the loop.

-- 1. Create the helper function
create or replace function get_my_circle_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select circle_id from public.users where id = auth.uid();
$$;

-- 2. Drop the problematic policy
drop policy if exists "Users can view circle members" on public.users;

-- 3. Create the fixed policy using the safe function
create policy "Users can view circle members"
  on public.users for select
  using (
    -- Access if user is in my circle (fetched safely)
    circle_id = get_my_circle_id()
    -- OR access my own profile
    or id = auth.uid()
  );

-- 4. OPTIONAL: Update other policies to use this function for better performance
-- (This prevents them from triggering the Users RLS unnecessarily)

drop policy if exists "Users can view circle consist logs" on public.consist_logs;
create policy "Users can view circle consist logs"
  on public.consist_logs for select
  using (
    user_id in (
      select id from public.users 
      where circle_id = get_my_circle_id()
    )
  );

drop policy if exists "Users can view circle pushes" on public.pushes;
create policy "Users can view circle pushes"
  on public.pushes for select
  using (
    from_user_id in (
      select id from public.users 
      where circle_id = get_my_circle_id()
    )
  );
