export interface GalleryRow {
  id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ImageRow {
  id: string
  gallery_id: string
  storage_path: string
  alt: string | null
  title: string | null
  link: string | null
  sort_order: number
  width: number | null
  height: number | null
  hidden: boolean
  created_at: string
  updated_at: string
}

// A visitor-submitted pixel-art drawing. `png_data` is RAW base64 (no
// "data:" prefix) — the client always prepends a hardcoded
// `data:image/png;base64,` literal at render time. See supabase/schema.sql.
export interface DrawingRow {
  id: string
  author_name: string
  message: string
  png_data: string
  hidden: boolean
  created_at: string
}

// Shape consumed by gallery components (mirrors old galleries.ts shape).
export interface GalleryImage {
  src: string
  alt: string
  title?: string
  link?: string
  // Intrinsic image dimensions — when present we open the viewer window at
  // an aspect-correct size (no letterboxing). Optional because legacy
  // bundled samples don't carry them, and we have a runtime fallback that
  // captures naturalWidth/naturalHeight from the grid thumbnail load.
  width?: number
  height?: number
  // Extras for admin (not used by public viewer):
  id?: string
  storagePath?: string
  sortOrder?: number
}

export interface ImageGallery {
  id: string
  name: string
  images: GalleryImage[]
}
