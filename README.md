# win-98-website

Personal portfolio in a Win98 desktop UI. React + Vite + 98.css + Tailwind, gallery data from Supabase Postgres, image assets from Supabase Storage.

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill values
```

Required env vars (`.env.local`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...        # server-only, used by seed scripts
SUPABASE_PROJECT_REF=<project-ref>
SUPABASE_DB_PASSWORD=<db-password>
DATABASE_URL=postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres
```

## First-time DB + Storage setup

1. **Run schema** — paste `supabase/schema.sql` into the Supabase SQL Editor and execute. Creates tables, RLS policies, the `site-images` bucket, and storage policies. Idempotent.
2. **Add yourself as admin** (SQL Editor):
   ```sql
   insert into admins (email) values ('your@email.com');
   ```
3. **Seed Storage + DB from existing static assets** (one-time):
   ```bash
   pnpm seed          # uploads public/site_images/ then inserts metadata
   ```
   Both scripts are idempotent — safe to re-run.

## Dev

```bash
pnpm dev             # Vite dev server
pnpm build           # tsc -b + vite build
pnpm lint            # eslint
```

## Admin UI

Click the **Admin** desktop icon (bottom-left). Sign in via email magic link. The account must be in the `admins` table (RLS-enforced) to access CRUD. Capabilities:
- Create / delete galleries
- Upload images (multiple files at once) into the selected gallery
- Edit per-image title / alt / link
- Reorder images (↑ / ↓)
- Delete images (removes file from Storage + row from DB)

## Architecture (high level)

```
Browser (Vite bundle)
  └─ supabase-js (publishable key)
       ├─ select galleries / images          (anon + authenticated)
       ├─ insert/update/delete               (authenticated + in admins)
       └─ storage.getPublicUrl(path)         → <img src>

Scripts (Node, tsx)
  └─ supabase-js (secret key)
       ├─ scripts/seed-storage.ts            walks public/site_images, uploads
       └─ scripts/seed-db.ts                 reads galleries.ts, upserts rows
```

See `supabase-plan.md` for migration phases and `architecture.md` for the wider system.
