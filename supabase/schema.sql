-- =============================================================================
-- CarApp database schema
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Row Level Security (RLS) is enabled on every table. RLS rules decide which rows
-- each logged-in user may read or change, so the app can talk to the database
-- directly without a custom backend server.
-- =============================================================================

-- ---------- Enum types (fixed lists of allowed values) ----------
create type public.user_role as enum ('user', 'organization', 'admin');
create type public.visibility as enum ('public', 'friends');
create type public.friendship_status as enum ('pending', 'accepted');
create type public.event_type as enum ('show', 'meet', 'track_day', 'other');
create type public.attendance_status as enum ('going', 'interested');
create type public.mod_category as enum (
  'engine', 'exhaust', 'suspension', 'wheels', 'brakes', 'interior', 'exterior', 'electronics', 'other'
);

-- ---------- Profiles (one row per user) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name text,
  avatar_url text,
  bio text,
  role public.user_role not null default 'user',
  is_verified boolean not null default false, -- set by an admin for organizations
  default_visibility public.visibility not null default 'public',
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Friendships ----------
create table public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- ---------- Helper functions used by the security rules ----------
create function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- Can the current user see something owned by `owner` with visibility `vis`?
create function public.can_view(owner uuid, vis public.visibility)
returns boolean
language sql stable
as $$
  select vis = 'public' or owner = auth.uid() or public.are_friends(owner, auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Only verified organizations and admins may create events.
create function public.can_create_events()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or (role = 'organization' and is_verified))
  );
$$;

-- ---------- Spots (photos of cars seen on the street) ----------
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  image_path text not null, -- path inside Supabase Storage
  make text not null,       -- e.g. 'Porsche'
  model text not null,      -- e.g. '911 GT3'
  year int check (year between 1886 and 2100),
  description text,
  city text,
  visibility public.visibility not null default 'public',
  created_at timestamptz not null default now()
);
create index spots_make_model_idx on public.spots (lower(make), lower(model));
create index spots_created_at_idx on public.spots (created_at desc);

create table public.likes (
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- ---------- Garage (the user's own cars) ----------
create table public.garage_cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  make text not null,
  model text not null,
  year int check (year between 1886 and 2100),
  nickname text,
  engine text,          -- e.g. '3.0 inline-6 turbo'
  horsepower int check (horsepower > 0),
  transmission text,    -- e.g. '6-speed manual'
  drivetrain text,      -- e.g. 'RWD'
  color text,
  description text,
  cover_image_path text,
  visibility public.visibility not null default 'public',
  created_at timestamptz not null default now()
);

create table public.garage_car_photos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.garage_cars (id) on delete cascade,
  image_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.modifications (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.garage_cars (id) on delete cascade,
  category public.mod_category not null,
  title text not null,      -- e.g. 'Akrapovic exhaust'
  description text,
  installed_on date,
  cost numeric(10, 2) check (cost >= 0),
  created_at timestamptz not null default now()
);

-- ---------- Events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  event_type public.event_type not null,
  brand text,               -- null = all brands welcome
  location_name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price numeric(10, 2) check (price >= 0), -- null or 0 = free
  currency text not null default 'EUR',
  ticket_url text,
  cover_image_path text,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_at_idx on public.events (starts_at);

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.attendance_status not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles          enable row level security;
alter table public.friendships       enable row level security;
alter table public.spots             enable row level security;
alter table public.likes             enable row level security;
alter table public.comments          enable row level security;
alter table public.garage_cars       enable row level security;
alter table public.garage_car_photos enable row level security;
alter table public.modifications     enable row level security;
alter table public.events            enable row level security;
alter table public.event_attendees   enable row level security;

-- Profiles: everyone logged in can read; you can edit only your own.
create policy "profiles: read" on public.profiles
  for select to authenticated using (true);
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Users must not promote themselves: only these columns are editable from the app.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, bio, default_visibility)
  on public.profiles to authenticated;

-- Friendships: only the two people involved can see/change them.
create policy "friendships: read own" on public.friendships
  for select to authenticated using (auth.uid() in (requester_id, addressee_id));
create policy "friendships: send request" on public.friendships
  for insert to authenticated with check (requester_id = auth.uid() and status = 'pending');
create policy "friendships: accept" on public.friendships
  for update to authenticated using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
create policy "friendships: remove" on public.friendships
  for delete to authenticated using (auth.uid() in (requester_id, addressee_id));

-- Spots: visible if public, yours, or a friend's.
create policy "spots: read" on public.spots
  for select to authenticated using (public.can_view(user_id, visibility));
create policy "spots: insert own" on public.spots
  for insert to authenticated with check (user_id = auth.uid());
create policy "spots: update own" on public.spots
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "spots: delete own or admin" on public.spots
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Likes and comments: only on spots you are allowed to see.
create policy "likes: read" on public.likes
  for select to authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id));
create policy "likes: add own" on public.likes
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.spots s where s.id = spot_id));
create policy "likes: remove own" on public.likes
  for delete to authenticated using (user_id = auth.uid());

create policy "comments: read" on public.comments
  for select to authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id));
create policy "comments: add own" on public.comments
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.spots s where s.id = spot_id));
create policy "comments: delete own or admin" on public.comments
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());
-- Note: `exists (select ... from spots)` already respects the spots read rule above.

-- Garage cars: same visibility rule as spots.
create policy "garage: read" on public.garage_cars
  for select to authenticated using (public.can_view(user_id, visibility));
create policy "garage: insert own" on public.garage_cars
  for insert to authenticated with check (user_id = auth.uid());
create policy "garage: update own" on public.garage_cars
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "garage: delete own" on public.garage_cars
  for delete to authenticated using (user_id = auth.uid());

-- Car photos and modifications follow the car they belong to.
create policy "car photos: read" on public.garage_car_photos
  for select to authenticated
  using (exists (select 1 from public.garage_cars c where c.id = car_id));
create policy "car photos: write own" on public.garage_car_photos
  for all to authenticated
  using (exists (select 1 from public.garage_cars c where c.id = car_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.garage_cars c where c.id = car_id and c.user_id = auth.uid()));

create policy "mods: read" on public.modifications
  for select to authenticated
  using (exists (select 1 from public.garage_cars c where c.id = car_id));
create policy "mods: write own" on public.modifications
  for all to authenticated
  using (exists (select 1 from public.garage_cars c where c.id = car_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.garage_cars c where c.id = car_id and c.user_id = auth.uid()));

-- Events: everyone reads; only verified organizations/admins create.
create policy "events: read" on public.events
  for select to authenticated using (true);
create policy "events: create" on public.events
  for insert to authenticated with check (created_by = auth.uid() and public.can_create_events());
create policy "events: update own or admin" on public.events
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy "events: delete own or admin" on public.events
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- Attendance: everyone sees who is going; you manage only your own status.
create policy "attendees: read" on public.event_attendees
  for select to authenticated using (true);
create policy "attendees: write own" on public.event_attendees
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- Make yourself admin (run separately after you sign up in the app):
--   update public.profiles set role = 'admin' where username = 'YOUR_USERNAME';
-- Verify an organization:
--   update public.profiles set role = 'organization', is_verified = true where username = '...';
-- =============================================================================
