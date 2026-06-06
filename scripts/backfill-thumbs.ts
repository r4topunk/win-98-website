/**
 * Backfill `<base>-thumb.webp` siblings in Supabase Storage for every row in
 * `images` that doesn't already have one.
 *
 * Why: AdminPanel now generates a thumb client-side on upload (see
 * src/lib/imageThumb.ts), but rows uploaded before that change still ship the
 * full master to the grid. This script downloads each master, runs cwebp
 * (long-edge 384px, q70 — same defaults as scripts/gen-thumbs.ts), and uploads
 * the thumb alongside.
 *
 * Usage:
 *   pnpm thumbs:backfill            # process only missing thumbs
 *   pnpm thumbs:backfill --force    # regenerate all thumbs
 *   pnpm thumbs:backfill --gallery <id>  # restrict to one gallery
 *
 * Requires `cwebp` on PATH (brew install webp) and SUPABASE_SECRET_KEY in
 * .env.local.
 */
import { execFile } from "node:child_process"
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, extname, dirname, basename } from "node:path"
import { promisify } from "node:util"
import { adminClient, STORAGE_BUCKET } from "./_admin-client.ts"

const execFileP = promisify(execFile)

const THUMB_SIZE = 384
const THUMB_QUALITY = 70

interface Opts {
  force: boolean
  gallery: string | null
}

function parseArgs(argv: string[]): Opts {
  const opts: Opts = { force: false, gallery: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--force") opts.force = true
    else if (a === "--gallery") opts.gallery = argv[++i] ?? null
  }
  return opts
}

function thumbPath(storagePath: string): string {
  const dot = storagePath.lastIndexOf(".")
  if (dot === -1 || dot < storagePath.lastIndexOf("/")) {
    return `${storagePath}-thumb.webp`
  }
  return `${storagePath.slice(0, dot)}-thumb.webp`
}

async function thumbExists(path: string): Promise<boolean> {
  // list(prefix=dirname, search=basename) is the cheap way to probe existence.
  const dir = dirname(path) || ""
  const name = basename(path)
  const { data, error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .list(dir, { limit: 1, search: name })
  if (error) throw error
  return (data ?? []).some((f) => f.name === name)
}

async function downloadToTemp(
  storagePath: string,
  tmpRoot: string,
): Promise<string> {
  const { data, error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .download(storagePath)
  if (error) throw error
  const ext = extname(storagePath) || ".bin"
  const tmp = join(tmpRoot, `src${ext}`)
  await writeFile(tmp, Buffer.from(await data.arrayBuffer()))
  return tmp
}

async function encodeThumb(src: string, dest: string) {
  await execFileP("cwebp", [
    "-mt",
    "-q",
    String(THUMB_QUALITY),
    "-resize",
    String(THUMB_SIZE),
    "0",
    "-quiet",
    src,
    "-o",
    dest,
  ])
}

async function uploadThumb(path: string, file: string) {
  const buf = await readFile(file)
  const { error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(path, buf, { contentType: "image/webp", upsert: true })
  if (error) throw error
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))

  let query = adminClient
    .from("images")
    .select("id,gallery_id,storage_path")
    .order("created_at", { ascending: true })
  if (opts.gallery) query = query.eq("gallery_id", opts.gallery)
  const { data, error } = await query
  if (error) throw error
  const rows = data ?? []

  console.log(
    `${rows.length} image row${rows.length === 1 ? "" : "s"}` +
      `${opts.gallery ? ` in gallery ${opts.gallery}` : ""}; ` +
      `size=${THUMB_SIZE}px q=${THUMB_QUALITY} force=${opts.force}`,
  )

  let made = 0
  let skipped = 0
  let failed = 0
  for (const row of rows) {
    const tp = thumbPath(row.storage_path)
    try {
      if (!opts.force && (await thumbExists(tp))) {
        skipped++
        continue
      }
      const tmpRoot = await mkdtemp(join(tmpdir(), "thumb-"))
      try {
        const src = await downloadToTemp(row.storage_path, tmpRoot)
        const dest = join(tmpRoot, "thumb.webp")
        await encodeThumb(src, dest)
        await uploadThumb(tp, dest)
        made++
        console.log(`  + ${tp}`)
      } finally {
        await rm(tmpRoot, { recursive: true, force: true })
      }
    } catch (e) {
      failed++
      console.error(`  ! ${row.storage_path}: ${(e as Error).message}`)
    }
  }

  console.log(
    `Done. Generated ${made}, skipped ${skipped} existing, ${failed} failed.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
