-- =============================================================================
-- Photo storage for the garage (your own cars).
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (Run schema.sql first — these rules look up the garage tables.)
--
-- Same idea as storage.sql for spots: a PRIVATE bucket, files under
-- garage/<user id>/<random id>.jpg, readable only if you may see the car.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garage', 'garage', false, 10485760, array['image/jpeg']) -- max 10 MB, JPEG only
on conflict (id) do nothing;

-- Upload: only into your own folder.
create policy "garage photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garage' and (storage.foldername(name))[1] = auth.uid()::text);

-- Read: your own photos, or photos of a car you are allowed to see.
-- The `exists` check goes through the garage read rules (public / own / friends).
create policy "garage photos: read visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'garage'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.garage_car_photos p where p.image_path = name)
    )
  );

-- Delete: only your own photos.
create policy "garage photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'garage' and (storage.foldername(name))[1] = auth.uid()::text);
