-- =============================================================================
-- Several photos per spot.
-- Run in Supabase (safe to run again): Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (Run schema.sql and storage.sql first.)
--
-- `spots.image_path` stays as the cover photo (the first one), so older code and
-- spots uploaded before this change keep working. Every photo of a spot, including
-- the cover, gets a row here, ordered by `position`.
-- =============================================================================

create table if not exists public.spot_photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  image_path text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists spot_photos_spot_id_idx on public.spot_photos (spot_id, position);

alter table public.spot_photos enable row level security;

-- Read: photos of spots you are allowed to see (the spots read rule does the filtering).
drop policy if exists "spot photos: read" on public.spot_photos;
create policy "spot photos: read" on public.spot_photos
  for select to authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id));

-- Add/change/remove: only on your own spots.
drop policy if exists "spot photos: write own" on public.spot_photos;
create policy "spot photos: write own" on public.spot_photos
  for all to authenticated
  using (exists (select 1 from public.spots s where s.id = spot_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.spots s where s.id = spot_id and s.user_id = auth.uid()));

-- Existing spots: copy their single photo into the new table.
insert into public.spot_photos (spot_id, image_path, position)
select id, image_path, 0 from public.spots
on conflict (image_path) do nothing;

-- Storage: also allow reading files that belong to a visible spot's extra photos.
drop policy if exists "spots photos: read visible" on storage.objects;
create policy "spots photos: read visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'spots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.spots s where s.image_path = name)
      or exists (select 1 from public.spot_photos p where p.image_path = name)
    )
  );
