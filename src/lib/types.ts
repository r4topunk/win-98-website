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
  created_at: string
  updated_at: string
}

// Shape consumed by gallery components (mirrors old galleries.ts shape).
export interface GalleryImage {
  src: string
  alt: string
  title?: string
  link?: string
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
