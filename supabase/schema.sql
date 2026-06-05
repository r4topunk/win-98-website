-- Run this in Supabase SQL Editor (or psql) once per project.
-- Idempotent: safe to re-run.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.galleries (
  id          text primary key,
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.images (
  id           uuid primary key default gen_random_uuid(),
  gallery_id   text not null references public.galleries(id) on delete cascade,
  storage_path text not null,
  alt          text,
  title        text,
  link         text,
  sort_order   int  not null default 0,
  width        int,
  height       int,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists images_gallery_path_uniq
  on public.images (gallery_id, storage_path);
create index if not exists images_gallery_sort_idx
  on public.images (gallery_id, sort_order);

-- Admin allowlist. Insert your own email manually after running this file.
create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at triggers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists galleries_set_updated_at on public.galleries;
create trigger galleries_set_updated_at
  before update on public.galleries
  for each row execute function public.set_updated_at();

drop trigger if exists images_set_updated_at on public.images;
create trigger images_set_updated_at
  before update on public.images
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.galleries enable row level security;
alter table public.images    enable row level security;
alter table public.admins    enable row level security;

-- Public read
drop policy if exists "galleries_public_read" on public.galleries;
create policy "galleries_public_read" on public.galleries
  for select to anon, authenticated using (true);

drop policy if exists "images_public_read" on public.images;
create policy "images_public_read" on public.images
  for select to anon, authenticated using (true);

-- Admin write (insert/update/delete) gated by admins table membership
drop policy if exists "galleries_admin_write" on public.galleries;
create policy "galleries_admin_write" on public.galleries
  for all to authenticated
  using ( exists (select 1 from public.admins a where a.email = auth.email()) )
  with check ( exists (select 1 from public.admins a where a.email = auth.email()) );

drop policy if exists "images_admin_write" on public.images;
create policy "images_admin_write" on public.images
  for all to authenticated
  using ( exists (select 1 from public.admins a where a.email = auth.email()) )
  with check ( exists (select 1 from public.admins a where a.email = auth.email()) );

-- admins table: authenticated user can read THEIR OWN row only.
-- (Avoid recursive policy that would require being admin to check if you're admin.)
drop policy if exists "admins_self_read" on public.admins;
drop policy if exists "admins_read_own" on public.admins;
create policy "admins_read_own" on public.admins
  for select to authenticated
  using ( email = auth.email() );

-- ============================================================
-- STORAGE
-- Bucket must exist first. Create it via Dashboard or:
--   insert into storage.buckets (id, name, public) values ('site-images','site-images',true)
--   on conflict (id) do nothing;
-- ============================================================

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

-- Public read of objects in this bucket
drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read" on storage.objects
  for select to anon, authenticated
  using ( bucket_id = 'site-images' );

-- Admin write
drop policy if exists "site_images_admin_write" on storage.objects;
create policy "site_images_admin_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.admins a where a.email = auth.email())
  )
  with check (
    bucket_id = 'site-images'
    and exists (select 1 from public.admins a where a.email = auth.email())
  );
