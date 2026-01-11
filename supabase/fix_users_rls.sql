-- ============================================================
-- FIX: Users Update RLS Policy
-- ============================================================
-- The existing update policy might be too restrictive or confusing the database.
-- We'll simplify it to generally allow users to update their own row.
-- RLS update policies can be tricky because they apply to both the "before" and "after" state.

-- 1. Drop existing update policy
drop policy if exists "Users can update their own profile" on public.users;

-- 2. Create a cleaner update policy
create policy "Users can update their own profile"
  on public.users for update
  using (id = auth.uid()); 
  -- Removed "with check" for now to simplify, as the "using" clause handles the row selection.
