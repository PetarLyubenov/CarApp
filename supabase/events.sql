-- =============================================================================
-- Events: cover photos and organizer applications.
-- Run in Supabase (safe to run again): Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (Run schema.sql first — the events tables and is_admin()/can_create_events() live there.)
-- =============================================================================

-- ---------- Event cover photos ----------
-- PUBLIC bucket: events are meant to be seen by everyone, so covers need no signed links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('events', 'events', true, 10485760, array['image/jpeg']) -- max 10 MB, JPEG only
on conflict (id) do nothing;

-- Upload: only organizers/admins, only into their own folder.
drop policy if exists "event covers: upload" on storage.objects;
create policy "event covers: upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'events'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_create_events()
  );

-- Delete: your own covers; admins can delete any.
drop policy if exists "event covers: delete own" on storage.objects;
create policy "event covers: delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'events'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------- Organizer applications ----------
-- A user asks to become an organization; an admin approves or rejects it in the app.
create table if not exists public.organization_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  org_name text not null check (char_length(org_name) between 2 and 100),
  website text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- At most one open (pending) application per user.
create unique index if not exists organization_requests_one_pending
  on public.organization_requests (user_id) where status = 'pending';

alter table public.organization_requests enable row level security;

drop policy if exists "org requests: read own or admin" on public.organization_requests;
create policy "org requests: read own or admin" on public.organization_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "org requests: apply" on public.organization_requests;
create policy "org requests: apply" on public.organization_requests
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
-- No update policy on purpose: only the function below may change a request.

-- Approve or reject an application. Runs with extra rights (security definer) because
-- it changes another user's role, which normal users can't do — so it checks for admin first.
create or replace function public.review_organization_request(request_id uuid, approve boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  req public.organization_requests;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review organizer applications';
  end if;

  select * into req from public.organization_requests where id = request_id and status = 'pending';
  if not found then
    raise exception 'Application not found or already reviewed';
  end if;

  update public.organization_requests
  set status = case when approve then 'approved' else 'rejected' end,
      reviewed_at = now()
  where id = request_id;

  if approve then
    update public.profiles
    set role = case when role = 'admin' then role else 'organization' end, -- never demote an admin
        is_verified = true,
        display_name = coalesce(display_name, req.org_name)
    where id = req.user_id;
  end if;
end;
$$;

revoke execute on function public.review_organization_request(uuid, boolean) from public, anon;
grant execute on function public.review_organization_request(uuid, boolean) to authenticated;
