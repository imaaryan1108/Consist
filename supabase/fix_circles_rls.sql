-- ============================================================
-- FIX: Circle Creation RLS Error
-- ============================================================
-- The error happens because when you create a circle, the client tries to return it.
-- But the "SELECT" policy only allows viewing circles you are a MEMBER of.
-- Since you haven't joined the circle yet (that happens in the next step),
-- you can't see the circle you just created!

-- SOLUTION: Allow users to view circles they created OR are members of.

-- 1. Drop the old restrictive policy
drop policy if exists "Users can view their own circle" on public.circles;

-- 2. Create the new permissive policy
create policy "Users can view their own circle"
  on public.circles for select
  using (
    -- Can see if I am a member
    id in (
      select circle_id from public.users where id = auth.uid()
    )
    -- OR if I created it (this fixes the insert error)
    or created_by = auth.uid()
  );
