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

## Phase 7 — Community drawings (anonymous pixel-art mural) (done ✓)

The "Desenhe" desktop icon now opens an interactive MS-Paint-style pixel editor
(64×64, `image-rendering: pixelated`) plus a public "Mural" of visitor drawings.
Visitors **without login** submit a drawing + name + message; admins moderate.

### Data model + security (all in `supabase/schema.sql`, idempotent)

- New table `public.drawings (id, author_name, message, png_data, hidden, created_at)`.
  `png_data` is **RAW base64** (no `data:` prefix) of a tiny PNG, stored inline —
  **no Storage upload**, so the `anon` role never gets write access to the public
  `site-images` bucket.
- **RLS** (the entire security boundary — there is no server):
  - `anon` is column-granted INSERT on `(author_name, message, png_data)` only, plus
    SELECT; **no UPDATE/DELETE**. Public read is `using (hidden = false)`.
  - admins (`admins`-table membership) get `for all` → can read hidden rows, hide,
    and delete.
- **Table-level CHECK constraints** (not just policy WITH CHECK, so they bind every
  writer): `author_name` 1–40 chars, `message` ≤280, `png_data` 100–6000 chars and
  matches `^[A-Za-z0-9+/]+={0,2}$` (forbids `:` → no `data:`/SVG smuggling).
- **Server-free throttles**: `drawings_rate_limit` trigger (≤10 inserts/min, global)
  and `drawings_total_cap` trigger (≤2000 visible rows).
- Render path is **load-bearing**: drawings are shown ONLY via `<img>` with a
  **hardcoded** `data:image/png;base64,` prefix; name/message render as escaped JSX
  text. Never fed to `window.open`/`<a href>`/`<iframe>`.

### Generalized hide for gallery images

- `public.images` gains `hidden boolean not null default false`; `images_public_read`
  now filters `using (hidden = false)`. The existing `images_admin_write` `for all`
  policy still grants admins SELECT (OR-combined), so admins see/hide/unhide any image.
- ⚠️ Hiding removes a row from queries but does **not** revoke the public Storage URL.
  For a true takedown of an abusive uploaded image, admin must also **Delete** it.

### Moderation mode

- Ships **reactive**: drawings are visible immediately; admins hide/delete bad ones.
- To switch to an **approval queue** later: add `approved boolean not null default false`
  and change `drawings_public_read` to `using (hidden = false and approved = true)`,
  then re-run `schema.sql`. (Commented in the file.) Fully reversible.

### Apply + rollback

- Apply: `pnpm tsx scripts/run-sql.ts supabase/schema.sql` (or paste into the Dashboard
  SQL editor). Idempotent — safe to re-run.
- Rollback: `drop table public.drawings cascade;` (+ the two trigger functions) removes
  the whole anon write surface; revert `images_public_read` to `using (true)` and
  optionally `alter table public.images drop column hidden;`.

### Optional hardening (not shipped — needs a test deploy)

- Add a CSP `headers` block to `vercel.json`:
  `default-src 'self'; img-src 'self' data: https://<ref>.supabase.co; frame-src https://www.youtube.com https://open.spotify.com; ...`
  Validate against the live site (heavy inline styles + YouTube/Spotify embeds) before shipping.
- If real spam appears, move INSERT behind a Supabase Edge Function gated by Cloudflare
  Turnstile + per-IP rate limit, then `revoke insert ... from anon`. Schema-compatible.
