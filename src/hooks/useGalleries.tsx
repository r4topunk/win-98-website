import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { isSupabaseConfigured, publicImageUrl, supabase } from "../lib/supabase"
import { sampleGalleries } from "../data/galleries"
import type {
  GalleryImage,
  GalleryRow,
  ImageGallery,
  ImageRow,
} from "../lib/types"

interface GalleriesState {
  byId: Record<string, ImageGallery>
  list: Array<{ id: string; name: string }>
  loading: boolean
  /** Set when the live fetch failed AND we fell back to bundled samples. */
  usingFallback: boolean
  /** Raw error message — kept for /admin diagnostics. Public UI should show
   *  a friendly line rather than echoing this string. */
  error: string | null
  reload: () => Promise<void>
}

// Build a (gallery map, gallery list) pair from the bundled sample data so
// the desktop renders something coherent on Supabase outage / first paint.
function loadSampleSnapshot(): {
  byId: Record<string, ImageGallery>
  list: Array<{ id: string; name: string }>
} {
  const byId: Record<string, ImageGallery> = {}
  const list: Array<{ id: string; name: string }> = []
  for (const [id, g] of Object.entries(sampleGalleries)) {
    byId[id] = g as ImageGallery
    list.push({ id, name: (g as ImageGallery).name })
  }
  return { byId, list }
}

const Ctx = createContext<GalleriesState | null>(null)

function rowToImage(row: ImageRow): GalleryImage {
  return {
    id: row.id,
    src: publicImageUrl(row.storage_path),
    alt: row.alt ?? "",
    title: row.title ?? undefined,
    link: row.link ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
  }
}

async function fetchAll() {
  const [galleriesRes, imagesRes] = await Promise.all([
    supabase
      .from("galleries")
      .select("id,name,sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("images")
      .select("id,gallery_id,storage_path,alt,title,link,sort_order,width,height")
      .order("sort_order", { ascending: true }),
  ])
  if (galleriesRes.error) throw galleriesRes.error
  if (imagesRes.error) throw imagesRes.error
  return {
    galleries: (galleriesRes.data ?? []) as GalleryRow[],
    images: (imagesRes.data ?? []) as ImageRow[],
  }
}

export function GalleriesProvider({ children }: { children: ReactNode }) {
  const [byId, setById] = useState<Record<string, ImageGallery>>({})
  const [list, setList] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Offline / pre-Supabase mode: serve bundled sample data so the desktop
    // renders without a backend. /admin remains unavailable.
    if (!isSupabaseConfigured) {
      const snap = loadSampleSnapshot()
      setById(snap.byId)
      setList(snap.list)
      setError(null)
      setUsingFallback(false) // explicit "no backend" is not a degraded state
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { galleries, images } = await fetchAll()
      const map: Record<string, ImageGallery> = {}
      for (const g of galleries) {
        map[g.id] = { id: g.id, name: g.name, images: [] }
      }
      for (const img of images) {
        const g = map[img.gallery_id]
        if (g) g.images.push(rowToImage(img))
      }
      setById(map)
      setList(galleries.map((g) => ({ id: g.id, name: g.name })))
      setUsingFallback(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // Loud in console for admin debugging — quiet, useful UI for visitors.
      console.error("[galleries] Supabase fetch failed, using bundled fallback:", msg)
      const snap = loadSampleSnapshot()
      setById(snap.byId)
      setList(snap.list)
      setError(msg)
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<GalleriesState>(
    () => ({ byId, list, loading, usingFallback, error, reload: load }),
    [byId, list, loading, usingFallback, error, load]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGalleries(): GalleriesState {
  const v = useContext(Ctx)
  if (!v) throw new Error("useGalleries must be used inside GalleriesProvider")
  return v
}

export function useGallery(id: string): ImageGallery | undefined {
  return useGalleries().byId[id]
}
