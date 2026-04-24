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

### Phase 2 — Schema
- [ ] `pnpm add -D drizzle-kit drizzle-orm postgres`
- [ ] `pnpm add @supabase/supabase-js`
- [ ] `drizzle.config.ts` pointing at `DATABASE_URL`
- [ ] `src/db/schema.ts` — galleries + images tables
- [ ] `pnpm drizzle-kit generate` → first migration
- [ ] `pnpm drizzle-kit migrate` → apply
- [ ] In Dashboard: enable RLS + add `anon select` policies

### Phase 3 — Storage bucket + seed
- [ ] Create bucket `site-images` (public read)
- [ ] `scripts/seed-storage.ts` — walk `public/site_images/`, upload each file preserving relative path
- [ ] `scripts/seed-db.ts` — read `src/data/galleries.ts`, insert galleries + images rows with matching `storage_path`
- [ ] Verify: `select count(*) from images` matches file count

### Phase 4 — Client wiring
- [ ] `src/lib/supabase.ts` — singleton client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `src/hooks/useGalleries.ts` — fetch + cache (simple `useState` + `useEffect`, no extra dep)
- [ ] Refactor `ImageGalleryGrid` / `ImageGalleryViewer` to consume hook instead of `sampleGalleries` import
- [ ] Replace `<img src="/site_images/...">` with `supabase.storage.from('site-images').getPublicUrl(path)`
- [ ] Loading + error states (keep minimal — 98.css-styled)

### Phase 5 — Cleanup
- [ ] Delete `public/site_images/` from repo
- [ ] Delete `sampleGalleries` export from `src/data/galleries.ts` (keep interfaces)
- [ ] Update `architecture.md` — storage + DB section
- [ ] Update `README.md` — env setup

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

Start Phase 2: install deps + write `src/db/schema.ts`.
