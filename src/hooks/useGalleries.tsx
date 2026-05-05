import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { publicImageUrl, supabase } from "../lib/supabase"
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
  error: string | null
  reload: () => Promise<void>
}

const Ctx = createContext<GalleriesState | null>(null)

function rowToImage(row: ImageRow): GalleryImage {
  return {
    id: row.id,
    src: publicImageUrl(row.storage_path),
    alt: row.alt ?? "",
    title: row.title ?? undefined,
    link: row.link ?? undefined,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
  }
}

async function fetchAll() {
  const [galleriesRes, imagesRes] = await Promise.all([
    supabase
      .from("galleries")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("images")
      .select("*")
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
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<GalleriesState>(
    () => ({ byId, list, loading, error, reload: load }),
    [byId, list, loading, error, load]
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
