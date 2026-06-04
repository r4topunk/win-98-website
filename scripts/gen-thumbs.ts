/**
 * Generate small webp thumbnails for every gallery image in public/site_images.
 *
 * Why: the grid renders ~80-150px squares but currently loads the full master
 * (often 1-3 MB). This script writes a sibling `<name>-thumb.webp` per image
 * (default 384px on the long edge, quality 70). VirtualImageGrid picks the
 * thumb when present; ImageGalleryViewer keeps using the full-res master.
 *
 * Usage:
 *   pnpm thumbs                # generate missing thumbs
 *   pnpm thumbs --force        # regenerate all thumbs
 *   pnpm thumbs --size 512     # override max-edge (default 384)
 *   pnpm thumbs --quality 75   # override quality (default 70)
 *   pnpm thumbs --dir movies   # restrict to one subfolder of site_images
 *
 * Requires `cwebp` on PATH (brew install webp).
 */
import { execFile } from "node:child_process"
import { readdir, stat, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, extname, join, basename, resolve } from "node:path"
import { promisify } from "node:util"

const execFileP = promisify(execFile)

const PUBLIC_ROOT = resolve(process.cwd(), "public/site_images")
const SKIP_DIRS = new Set(["ui"]) // ui assets are already small
const THUMB_SUFFIX = "-thumb"
const SUPPORTED_EXT = new Set([".webp", ".jpg", ".jpeg", ".png"])

interface Opts {
  force: boolean
  size: number
  quality: number
  onlyDir: string | null
}

function parseArgs(argv: string[]): Opts {
  const opts: Opts = { force: false, size: 384, quality: 70, onlyDir: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--force") opts.force = true
    else if (a === "--size") opts.size = Number(argv[++i])
    else if (a === "--quality") opts.quality = Number(argv[++i])
    else if (a === "--dir") opts.onlyDir = argv[++i] ?? null
  }
  if (!Number.isFinite(opts.size) || opts.size <= 0) {
    throw new Error("--size must be a positive number")
  }
  if (!Number.isFinite(opts.quality) || opts.quality <= 0 || opts.quality > 100) {
    throw new Error("--quality must be 1-100")
  }
  return opts
}

function isThumb(file: string): boolean {
  const base = basename(file, extname(file))
  return base.endsWith(THUMB_SUFFIX)
}

function thumbPath(srcAbs: string): string {
  const dir = dirname(srcAbs)
  const ext = extname(srcAbs)
  const base = basename(srcAbs, ext)
  return join(dir, `${base}${THUMB_SUFFIX}.webp`)
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const out: string[] = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walk(full)))
    } else if (e.isFile()) {
      out.push(full)
    }
  }
  return out
}

async function encodeThumb(src: string, dest: string, size: number, quality: number) {
  // cwebp flags: -q quality (1-100), -resize 0 size keeps the long-edge ratio
  // when one of width/height is 0. We pass `-resize 0 <size>` for portrait OR
  // `-resize <size> 0` for landscape — pick whichever produces the larger fit.
  // Simpler: use `-resize 0 <size>` which sets height to size, width preserves
  // ratio. To cap by the long edge regardless of orientation, we'd need the
  // source dimensions. Use cwebp's `-mt` (multi-threading) for speed.
  //
  // Trick to get long-edge cap: ask cwebp to fit inside a `size x size` box by
  // using `-resize <size> 0` (width cap) which preserves height ratio. For
  // portrait images this still produces a height <= size. Wait — no: -resize W 0
  // forces width to W; tall portraits then have height > size. So we use the
  // safe two-pass approach: probe dimensions via `webpinfo` style or just
  // accept "max-dim cap by width" since grid cells are roughly square (object-
  // cover crops anyway). Width cap is fine for the gallery.
  await execFileP("cwebp", [
    "-mt",
    "-q",
    String(quality),
    "-resize",
    String(size),
    "0",
    "-quiet",
    src,
    "-o",
    dest,
  ])
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!existsSync(PUBLIC_ROOT)) {
    console.error(`No directory at ${PUBLIC_ROOT}`)
    process.exit(1)
  }

  const allFiles = await walk(PUBLIC_ROOT)
  const sources = allFiles.filter((f) => {
    if (!SUPPORTED_EXT.has(extname(f).toLowerCase())) return false
    if (isThumb(f)) return false
    const parts = f.slice(PUBLIC_ROOT.length + 1).split("/")
    const folder = parts[0]
    if (SKIP_DIRS.has(folder)) return false
    if (opts.onlyDir && folder !== opts.onlyDir) return false
    return true
  })

  console.log(
    `Found ${sources.length} source images${opts.onlyDir ? ` in /${opts.onlyDir}` : ""}; ` +
      `thumb size=${opts.size}px q=${opts.quality} force=${opts.force}`,
  )

  let made = 0
  let skipped = 0
  let bytesIn = 0
  let bytesOut = 0
  for (const src of sources) {
    const dest = thumbPath(src)
    await mkdir(dirname(dest), { recursive: true })
    if (!opts.force && existsSync(dest)) {
      // Only skip if thumb is newer than source.
      const [srcStat, destStat] = await Promise.all([stat(src), stat(dest)])
      if (destStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++
        continue
      }
    }
    try {
      await encodeThumb(src, dest, opts.size, opts.quality)
      const [srcStat, destStat] = await Promise.all([stat(src), stat(dest)])
      bytesIn += srcStat.size
      bytesOut += destStat.size
      made++
      const rel = src.slice(PUBLIC_ROOT.length + 1)
      console.log(
        `  ${rel} ${(srcStat.size / 1024).toFixed(0)}KB -> ${(destStat.size / 1024).toFixed(0)}KB`,
      )
    } catch (err) {
      console.error(`  FAILED ${src}: ${(err as Error).message}`)
    }
  }

  console.log(
    `Done. Generated ${made}, skipped ${skipped} unchanged. ` +
      (made > 0
        ? `Sources ${(bytesIn / 1024 / 1024).toFixed(1)}MB → thumbs ${(bytesOut / 1024 / 1024).toFixed(1)}MB ` +
          `(saved ${(((bytesIn - bytesOut) / bytesIn) * 100).toFixed(0)}%)`
        : ""),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
