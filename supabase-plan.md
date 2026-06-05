# Supabase Migration Plan

## Objective

Move gallery metadata + image assets from static repo (`src/data/galleries.ts`, `public/site_images/`) to Supabase (Postgres + Storage). Enable content updates without redeploy.

## Scope

In scope:
- Image hosting via Supabase Storage (replace `public/site_images/`)
- Gallery/image metadata in Postgres (replace hardcoded `sampleGalleries`)
- Read-only client using publishable key + RLS
- Drizzle schema + migrations (server-side only)

Out of scope (for now):
- Auth / user accounts
- Admin UI for managing galleries
- CDN / custom domain in front of Storage
- Realtime subscriptions

## Architecture

```
Browser (Vite bundle)
  └─ @supabase/supabase-js (publishable key)
       ├─ GET /rest/v1/galleries → list
       ├─ GET /rest/v1/images?gallery_id=eq.X → images
       └─ storage.from('site-images').getPublicUrl(path) → <img src>

Scripts (node, server-side)
  └─ drizzle-kit (DATABASE_URL + secret key)
       ├─ migrations → schema
       └─ seed → upload images + insert rows
```

## Data model

```sql
-- galleries
id          text primary key         -- "movies", "images", "rejects"
title       text not null
description text
sort_order  int  not null default 0
created_at  timestamptz default now()

-- images
id          uuid primary key default gen_random_uuid()
gallery_id  text references galleries(id) on delete cascade
storage_path text not null           -- "movies/1.webp"
alt         text
caption     text
sort_order  int not null default 0
width       int
height      int
created_at  timestamptz default now()

index images(gallery_id, sort_order)
```

RLS: enable on both; policy `select` allowed for `anon` role. No insert/update/delete from client.

Storage: single bucket `site-images`, public read, private write (secret key only).

## Phases

### Phase 1 — Infra (done ✓)
- [x] Project created (`kfibkneukiwmxeezqwak`)
- [x] Keys in `.env.local`, `.env.example` committed
- [x] REST + Storage access smoke-tested

### Phase 2 — Schema (done ✓)
- [x] `pnpm add @supabase/supabase-js` + dev: `tsx`, `dotenv`, `mime-types`
- [x] **Drizzle skipped** — single `supabase/schema.sql` (idempotent), run in Dashboard SQL Editor
- [x] Tables: `galleries`, `images`, `admins`
- [x] RLS: public select on galleries/images; insert/update/delete gated by `admins.email = auth.email()`
- [x] Storage bucket + policies created in same SQL file

### Phase 3 — Storage bucket + seed (done ✓)
- [x] Bucket `site-images` (public read) created via SQL
- [x] `scripts/seed-storage.ts` — idempotent (skips files matching size)
- [x] `scripts/seed-db.ts` — upsert by `(gallery_id, storage_path)`
- [x] Run via `pnpm seed`

### Phase 4 — Client wiring (done ✓)
- [x] `src/lib/supabase.ts` — singleton client, `publicImageUrl()` helper
- [x] `src/hooks/useGalleries.tsx` — context + provider, single fetch on mount
- [x] `WindowContents.tsx` consumes hook; `ImageGalleryGrid` / `Viewer` unchanged (URL is just a string)

### Phase 5 — Admin UI (added scope, done ✓)
- [x] `src/components/admin/AdminApp.tsx` — magic-link auth + admin-allowlist gate
- [x] `src/components/admin/AdminPanel.tsx` — gallery CRUD, image upload/edit/reorder/delete
- [x] Wired as desktop icon "Admin" inside the win98 desktop window manager

### Phase 6 — Cleanup (todo)
- [ ] Verify production build + dev run with real Supabase project
- [ ] Delete `public/site_images/` (keep only `ui/` UI chrome) once Supabase confirmed
- [ ] Delete `sampleGalleries` export from `src/data/galleries.ts` (keep file or remove)
- [ ] Update `architecture.md` — storage + DB + admin sections

## Definition of done

- Gallery windows render from Supabase on fresh clone + `cp .env.example .env.local` + keys filled
- No images in `public/` beyond UI chrome (icons, bg, intro.webm)
- First paint of gallery ≤ current static perf (measure: lighthouse LCP delta < 200ms)
- RLS verified: client with publishable key cannot `insert`/`delete`

## Risks

- **Public bucket leaks**: anyone with URL sees any file. Acceptable — current repo already ships these publicly. Mitigate later with signed URLs if needed.
- **Cold-start latency on Supabase free tier**: may add 100–500ms to first query. Mitigate: prefetch on app mount.
- **Image count inflation**: `galleries.ts` currently hardcodes ~50+ images. Seed script must be idempotent (upsert on `(gallery_id, storage_path)`).
- **Migration drift**: Drizzle + Supabase Dashboard can fight. Rule: schema only via Drizzle, policies only via Dashboard SQL editor (or versioned SQL file).

## UNKNOWN

- Image dimensions — not in current `galleries.ts`. Extract during seed via `sharp` or leave null for now.
- Expected gallery-edit cadence — if weekly, add admin UI in Phase 6; if rare, manual SQL is fine.
- Total Storage size — estimate before leaving free tier (1GB limit).

## Next action

1. Run `supabase/schema.sql` in Supabase SQL Editor (Dashboard → SQL).
2. `insert into admins (email) values ('your@email.com');`
3. `pnpm seed` to migrate metadata + images.
4. `pnpm dev`, verify galleries render. Open Admin icon, sign in via magic link, test CRUD.
5. After confirmed: delete `public/site_images/<gallery>/` folders (keep `public/site_images/ui/` for background + menu).
