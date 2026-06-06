// Client-side thumb generator. Mirrors scripts/gen-thumbs.ts conventions:
// long-edge 384px, webp q70, sibling `<base>-thumb.webp` storage path.
// Used by AdminPanel on upload so Supabase-hosted images get the same
// fast-grid treatment as bundled /site_images assets.

const THUMB_MAX_EDGE = 384
const THUMB_QUALITY = 0.7

export const THUMB_SUFFIX = "-thumb"
export const THUMB_EXT = ".webp"

export function thumbStoragePath(storagePath: string): string {
  const dot = storagePath.lastIndexOf(".")
  if (dot === -1 || dot < storagePath.lastIndexOf("/")) {
    return `${storagePath}${THUMB_SUFFIX}${THUMB_EXT}`
  }
  return `${storagePath.slice(0, dot)}${THUMB_SUFFIX}${THUMB_EXT}`
}

export async function generateThumbBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const longEdge = Math.max(bitmap.width, bitmap.height)
    const scale = longEdge > THUMB_MAX_EDGE ? THUMB_MAX_EDGE / longEdge : 1
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("2d context unavailable")
      ctx.drawImage(bitmap, 0, 0, w, h)
      return await canvas.convertToBlob({
        type: "image/webp",
        quality: THUMB_QUALITY,
      })
    }

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d context unavailable")
    ctx.drawImage(bitmap, 0, 0, w, h)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/webp",
        THUMB_QUALITY,
      )
    })
  } finally {
    bitmap.close?.()
  }
}
