-- =============================================================================
-- Photo storage for spots.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (Run schema.sql first — these rules look up the `spots` table.)
--
-- The bucket is PRIVATE: photos are reachable only through short-lived signed URLs,
-- so "friends only" spots can't be opened by strangers who guess the link.
--
-- File layout:  spots/<user id>/<random id>.jpg
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spots', 'spots', false, 10485760, array['image/jpeg']) -- max 10 MB, JPEG only
on conflict (id) do nothing;

-- Upload: only into your own folder.
create policy "spots photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'spots' and (storage.foldername(name))[1] = auth.uid()::text);

-- Read: your own photos, or any photo whose spot you are allowed to see.
-- The `exists` check goes through the spots read rule (public / own / friends).
create policy "spots photos: read visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'spots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.spots s where s.image_path = name)
    )
  );

-- Delete: only your own photos.
create policy "spots photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'spots' and (storage.foldername(name))[1] = auth.uid()::text);
