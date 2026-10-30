-- =============================================================================
-- Rare cars and badges.
-- Run in Supabase (safe to run again): Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- A car counts as RARE when:
--   1. its make is on the exotic list below (Ferrari, Koenigsegg, ...), or
--   2. the app already has 100+ spots and this make + model was spotted at most 2 times
--      by everyone together. (With only a few spots every model would look "rare",
--      so this second rule waits until there is enough data.)
--
-- Badges are not stored: the app reads a person's numbers (spots, rare cars, brands, ...)
-- with user_stats() and a badge is earned once a number reaches its goal.
-- =============================================================================

-- ---------- Exotic makes ----------
create table if not exists public.rare_makes (
  make text primary key -- lower-case, e.g. 'ferrari'
);
alter table public.rare_makes enable row level security;
drop policy if exists "rare makes: read" on public.rare_makes;
create policy "rare makes: read" on public.rare_makes for select to authenticated using (true);

insert into public.rare_makes (make) values
  ('ferrari'), ('lamborghini'), ('pagani'), ('koenigsegg'), ('bugatti'), ('mclaren'),
  ('aston martin'), ('rolls-royce'), ('bentley'), ('maserati'), ('lotus'), ('rimac'),
  ('maybach'), ('spyker'), ('hennessey'), ('ssc'), ('gordon murray'), ('w motors'),
  ('de tomaso'), ('noble'), ('ariel'), ('morgan'), ('alpina'), ('lancia')
on conflict (make) do nothing;

-- ---------- The rarity rule ----------
-- security definer: counts ALL spots, including other people's "friends only" ones.
-- It only returns true/false, so no private spot is revealed.
create or replace function public.is_rare_car(car_make text, car_model text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists (select 1 from public.rare_makes r where r.make = lower(trim(car_make)))
    or (
      (select count(*) from public.spots) >= 100
      and (
        select count(*) from public.spots s
        where lower(s.make) = lower(car_make) and lower(s.model) = lower(car_model)
      ) <= 2
    );
$$;

-- "Computed field": the app can ask for `is_rare` as if it were a column of spots,
-- e.g. select('*, is_rare').
create or replace function public.is_rare(spot public.spots)
returns boolean
language sql stable set search_path = ''
as $$
  select public.is_rare_car(spot.make, spot.model);
$$;

-- ---------- A person's numbers for badges ----------
-- Only counts, never the items themselves, so "friends only" content stays private.
create or replace function public.user_stats(target uuid)
returns table (
  spots int,
  rare_spots int,
  makes int,
  likes_received int,
  friends int,
  cars int,
  mods int
)
language sql stable security definer set search_path = ''
as $$
  select
    (select count(*) from public.spots s where s.user_id = target)::int,
    (select count(*) from public.spots s
       where s.user_id = target and public.is_rare_car(s.make, s.model))::int,
    (select count(distinct lower(s.make)) from public.spots s where s.user_id = target)::int,
    -- likes from other people on this person's spots
    (select count(*) from public.likes l join public.spots s on s.id = l.spot_id
       where s.user_id = target and l.user_id <> target)::int,
    (select count(*) from public.friendships f
       where f.status = 'accepted' and target in (f.requester_id, f.addressee_id))::int,
    (select count(*) from public.garage_cars c where c.user_id = target)::int,
    (select count(*) from public.modifications m join public.garage_cars c on c.id = m.car_id
       where c.user_id = target)::int;
$$;

-- ---------- Ranking: who spotted the most rare cars ----------
create or replace function public.rare_leaderboard(max_rows int default 10)
returns table (user_id uuid, username text, display_name text, rare_spots int)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.username, p.display_name, count(*)::int
  from public.spots s
  join public.profiles p on p.id = s.user_id
  where public.is_rare_car(s.make, s.model)
  group by p.id, p.username, p.display_name
  order by count(*) desc, p.username
  limit least(max_rows, 50);
$$;

-- Only signed-in users may call these.
revoke execute on function public.is_rare_car(text, text) from public, anon;
revoke execute on function public.is_rare(public.spots) from public, anon;
revoke execute on function public.user_stats(uuid) from public, anon;
revoke execute on function public.rare_leaderboard(int) from public, anon;
grant execute on function public.is_rare_car(text, text) to authenticated;
grant execute on function public.is_rare(public.spots) to authenticated;
grant execute on function public.user_stats(uuid) to authenticated;
grant execute on function public.rare_leaderboard(int) to authenticated;
