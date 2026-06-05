// Defines which galleries the admin can manage and the schema of each.
// Single-image "app" galleries (paint, pix, campominado) are intentionally
// excluded — those are wired to specific desktop icons and shouldn't be edited.

export type GalleryKind = "video" | "audio" | "photo"

export interface GalleryTypeConfig {
  kind: GalleryKind
  /** Should the upload form expose a link field? */
  hasLink: boolean
  /** Is the link required when present? */
  linkRequired: boolean
  /** UI label for the link field. */
  linkLabel?: string
  /** Optional substring that must appear in the link to validate. */
  linkHostHint?: string
}

export const GALLERY_TYPES: Record<string, GalleryTypeConfig> = {
  movies: {
    kind: "video",
    hasLink: true,
    linkRequired: true,
    linkLabel: "YouTube URL",
    linkHostHint: "youtu",
  },
  "album-covers": {
    kind: "audio",
    hasLink: true,
    linkRequired: false,
    linkLabel: "Spotify URL (optional)",
    linkHostHint: "spotify",
  },
  images: { kind: "photo", hasLink: false, linkRequired: false },
  customs: { kind: "photo", hasLink: false, linkRequired: false },
  "pelo-mundo": { kind: "photo", hasLink: false, linkRequired: false },
  rejects: { kind: "photo", hasLink: false, linkRequired: false },
}

export function isManagedGallery(id: string): boolean {
  return id in GALLERY_TYPES
}

export function galleryConfig(id: string): GalleryTypeConfig | undefined {
  return GALLERY_TYPES[id]
}
