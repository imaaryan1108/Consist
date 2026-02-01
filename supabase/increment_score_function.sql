-- Helper function to increment user score atomically
-- This prevents race conditions when multiple operations award points

create or replace function increment_user_score(user_id uuid, points int)
returns void as $$
begin
  update public.users
  set score = score + points
  where id = user_id;
end;
$$ language plpgsql security definer;
