// Walks public/site_images/ and uploads every file to the `site-images` bucket,
// preserving relative path. Idempotent: skips files already present with the
// same byte size.
//
// Run: pnpm tsx scripts/seed-storage.ts

import { promises as fs } from "node:fs"
import path from "node:path"
import mime from "mime-types"
import { adminClient, STORAGE_BUCKET } from "./_admin-client"

const ROOT = path.resolve(process.cwd(), "public/site_images")

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full)))
    else if (e.isFile()) out.push(full)
  }
  return out
}

async function existingObjects(): Promise<Map<string, number>> {
  // List recursively. Storage list is per-prefix; we walk known top-level dirs.
  const map = new Map<string, number>()
  const top = await adminClient.storage
    .from(STORAGE_BUCKET)
    .list("", { limit: 1000 })
  if (top.error) throw top.error
  const folders = (top.data ?? []).filter((o) => o.id === null)
  // Files at root
  for (const f of (top.data ?? []).filter((o) => o.id !== null)) {
    map.set(f.name, (f.metadata?.size as number) ?? -1)
  }
  for (const folder of folders) {
    const inner = await adminClient.storage
      .from(STORAGE_BUCKET)
      .list(folder.name, { limit: 5000 })
    if (inner.error) throw inner.error
    for (const f of inner.data ?? []) {
      if (f.id === null) continue
      map.set(`${folder.name}/${f.name}`, (f.metadata?.size as number) ?? -1)
    }
  }
  return map
}

async function main() {
  const files = await walk(ROOT)
  console.log(`Found ${files.length} local files`)

  const existing = await existingObjects()
  console.log(`Bucket has ${existing.size} existing objects`)

  let uploaded = 0
  let skipped = 0
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/")
    const stat = await fs.stat(abs)
    const existingSize = existing.get(rel)
    if (existingSize === stat.size) {
      skipped++
      continue
    }
    const buf = await fs.readFile(abs)
    const contentType = mime.lookup(abs) || "application/octet-stream"
    const { error } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(rel, buf, { contentType, upsert: true })
    if (error) {
      console.error(`FAIL ${rel}: ${error.message}`)
      continue
    }
    uploaded++
    if (uploaded % 10 === 0) console.log(`  uploaded ${uploaded}...`)
  }

  console.log(`Done. uploaded=${uploaded} skipped=${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
