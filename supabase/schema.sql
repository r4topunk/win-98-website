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
-- Hard-capped at 2 rows by the admins_cap_trigger below — to rotate, DELETE
-- an existing row first, then INSERT the new one.
create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- Hard cap: never more than 2 admins. Belt-and-suspenders even when running
-- as service_role (which bypasses RLS). To rotate: DELETE first, then INSERT.
create or replace function public.enforce_admins_cap()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.admins) >= 2 then
    raise exception 'admins table is capped at 2 rows (current count: %)',
      (select count(*) from public.admins);
  end if;
  return new;
end;
$$;

drop trigger if exists admins_cap_trigger on public.admins;
create trigger admins_cap_trigger
  before insert on public.admins
  for each row execute function public.enforce_admins_cap();

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

-- ============================================================
-- DRAWINGS (anonymous pixel-art mural)
-- Visitors with NO login submit a tiny base64 PNG + name + message;
-- the public reads only visible rows; admins (admins-table membership)
-- hide/delete anything. All anon writes are confined to this one table
-- and bounded by RLS + table-level CHECK constraints + throttle triggers.
-- The pixel art is stored INLINE as raw base64 (no "data:" prefix, no
-- Storage upload), so the anon role never gets write access to the
-- public site-images bucket.
-- ============================================================

create table if not exists public.drawings (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  message     text not null default '',
  png_data    text not null,                 -- RAW base64 ONLY, no "data:" prefix
  hidden      boolean not null default false, -- moderation flag (NOT NULL = no limbo)
  created_at  timestamptz not null default now()
);

-- Mural list reads non-hidden rows newest-first; this index serves it.
create index if not exists drawings_visible_idx
  on public.drawings (hidden, created_at desc);

-- Size/shape guardrails as TABLE-LEVEL CHECK constraints: enforced for every
-- writer (incl. service_role and any future code path), not only in the policy
-- WITH CHECK. These are the real DoS/size bounds.
alter table public.drawings drop constraint if exists drawings_author_len;
alter table public.drawings add  constraint drawings_author_len
  check (char_length(btrim(author_name)) between 1 and 40);

alter table public.drawings drop constraint if exists drawings_message_len;
alter table public.drawings add  constraint drawings_message_len
  check (char_length(message) <= 280);

-- ~6000 chars comfortably fits a 64x64 limited-palette PNG (typically
-- 1-2 KB, worst ~3.5 KB as base64) with headroom, while hard-blocking
-- megabyte blobs pushed through the anon endpoint.
alter table public.drawings drop constraint if exists drawings_png_len;
alter table public.drawings add  constraint drawings_png_len
  check (char_length(png_data) between 100 and 6000);

-- Alphabet sanity only (NOT a content guarantee). Forbidding ':' means a
-- stored "data:text/html"/"data:image/svg+xml" can never reach an attribute.
alter table public.drawings drop constraint if exists drawings_png_b64;
alter table public.drawings add  constraint drawings_png_b64
  check (png_data ~ '^[A-Za-z0-9+/]+={0,2}$');

-- BLOCKING: RLS must be explicitly enabled, else the anon key has full access.
alter table public.drawings enable row level security;

-- Column-level grants: anon can physically write ONLY the three user columns,
-- never hidden/id/created_at. anon gets SELECT (mural) + scoped INSERT only;
-- no UPDATE/DELETE (so anon cannot edit or remove any row, incl. its own).
revoke all on public.drawings from anon;
grant select on public.drawings to anon;
grant insert (author_name, message, png_data) on public.drawings to anon;

-- Public read: only non-hidden rows. This single predicate is the anon filter.
-- APPROVAL QUEUE FLIP (if spam ever appears): add a column
--   alter table public.drawings add column if not exists approved boolean not null default false;
-- and change the USING below to `using (hidden = false and approved = true)`.
-- Anon insert still works (approved stays false); admin flips approved=true to publish.
drop policy if exists "drawings_public_read" on public.drawings;
create policy "drawings_public_read" on public.drawings
  for select to anon, authenticated using (hidden = false);

-- Anon insert: pins hidden=false; mirrors the CHECKs for fail-fast feedback.
drop policy if exists "drawings_anon_insert" on public.drawings;
create policy "drawings_anon_insert" on public.drawings
  for insert to anon
  with check (
    hidden = false
    and char_length(btrim(author_name)) between 1 and 40
    and char_length(message) <= 280
    and char_length(png_data) between 100 and 6000
  );

-- Admin: FOR ALL (load-bearing — FOR ALL contributes a USING branch to SELECT,
-- so an admin OR-combines public_read(hidden=false) with this and sees EVERY
-- row incl. hidden ones to moderate). Same admins-membership gate as
-- galleries_admin_write / images_admin_write.
drop policy if exists "drawings_admin_all" on public.drawings;
create policy "drawings_admin_all" on public.drawings
  for all to authenticated
  using      ( exists (select 1 from public.admins a where a.email = auth.email()) )
  with check ( exists (select 1 from public.admins a where a.email = auth.email()) );

-- Global insert-rate circuit-breaker. anon has no stable identity, so this is a
-- COARSE GLOBAL throttle (self-DoS-tolerant: the artist prefers the mural going
-- briefly read-only over the DB filling). Mirrors the admins_cap_trigger pattern.
create or replace function public.drawings_rate_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.drawings
        where created_at > now() - interval '1 minute') >= 10 then
    raise exception 'rate limit: too many drawings, try again shortly';
  end if;
  return new;
end;
$$;
drop trigger if exists drawings_rate_limit_trg on public.drawings;
create trigger drawings_rate_limit_trg
  before insert on public.drawings
  for each row execute function public.drawings_rate_limit();

-- Hard ceiling so the table can never balloon the DB. Counts non-hidden rows so
-- moderation (hiding) keeps the mural submittable.
create or replace function public.drawings_total_cap()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.drawings where hidden = false) >= 2000 then
    raise exception 'drawings mural is full';
  end if;
  return new;
end;
$$;
drop trigger if exists drawings_total_cap_trg on public.drawings;
create trigger drawings_total_cap_trg
  before insert on public.drawings
  for each row execute function public.drawings_total_cap();

-- ============================================================
-- GENERALIZED HIDE for gallery images
-- Lets admins hide ANY content (not just drawings). NOT NULL + default false
-- backfills existing rows to visible (no row vanishes on migration).
-- NOTE: hiding removes the row from queries but does NOT revoke the public
-- Storage object URL (the site-images bucket is public). For genuinely
-- sensitive/abusive uploads the admin must ALSO delete the storage object.
-- ============================================================

alter table public.images add column if not exists hidden boolean not null default false;

-- ONLY change vs. the original: public read now filters hidden. The existing
-- images_admin_write FOR ALL policy already grants admins SELECT, so admins
-- keep seeing hidden rows via OR-combination — no new admin policy needed.
drop policy if exists "images_public_read" on public.images;
create policy "images_public_read" on public.images
  for select to anon, authenticated using (hidden = false);
