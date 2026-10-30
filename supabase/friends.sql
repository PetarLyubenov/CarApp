-- =============================================================================
-- Friends: safety fixes for the friendships table from schema.sql.
-- Run in Supabase (safe to run again): Dashboard -> SQL Editor -> New query -> paste -> Run.
-- =============================================================================

-- Only one friendship row per pair of people, whichever of them sent the request.
-- (The primary key alone would still allow both A->B and B->A.)
create unique index if not exists friendships_one_per_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- When accepting a request, only the status may change. Without this, the person
-- accepting could rewrite `requester_id` and make themselves friends with anyone —
-- and see that person's "friends only" photos and cars.
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;
