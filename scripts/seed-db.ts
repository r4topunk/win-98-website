// Reads src/data/galleries.ts and seeds the galleries + images tables.
// Idempotent: upsert by (gallery_id, storage_path).
//
// Run: pnpm tsx scripts/seed-db.ts

import { sampleGalleries } from "../src/data/galleries"
import { adminClient } from "./_admin-client"

// TS gallery key -> DB id (slug).
const GALLERY_ID_MAP: Record<string, string> = {
  movies: "movies",
  images: "images",
  albumCovers: "album-covers",
  customs: "customs",
  peloMundo: "pelo-mundo",
  rejects: "rejects",
  paint: "paint",
  pix: "pix",
  campominado: "campominado",
}

// Strip the leading "/site_images/" from `src` to get the storage path.
function toStoragePath(src: string): string {
  return src.replace(/^\/site_images\//, "")
}

async function upsertGalleries() {
  const rows = Object.entries(sampleGalleries).map(([key, g], idx) => ({
    id: GALLERY_ID_MAP[key] ?? key,
    name: g.name,
    sort_order: idx,
  }))
  const { error } = await adminClient
    .from("galleries")
    .upsert(rows, { onConflict: "id" })
  if (error) throw error
  console.log(`upserted ${rows.length} galleries`)
}

async function upsertImages() {
  let total = 0
  for (const [key, gallery] of Object.entries(sampleGalleries)) {
    const galleryId = GALLERY_ID_MAP[key] ?? key
    const rows = gallery.images.map((img, idx) => ({
      gallery_id: galleryId,
      storage_path: toStoragePath(img.src),
      alt: img.alt ?? null,
      title: img.title ?? null,
      link: img.link ?? null,
      sort_order: idx,
    }))
    const { error } = await adminClient
      .from("images")
      .upsert(rows, { onConflict: "gallery_id,storage_path" })
    if (error) throw error
    total += rows.length
    console.log(`  ${galleryId}: ${rows.length} images`)
  }
  console.log(`upserted ${total} images`)
}

async function main() {
  await upsertGalleries()
  await upsertImages()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
