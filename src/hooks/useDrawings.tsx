import { useCallback, useEffect, useState } from "react"
import {
  fetchVisibleDrawings,
  PAGE_SIZE,
} from "../lib/drawings"
import { isSupabaseConfigured } from "../lib/supabase"
import type { DrawingRow } from "../lib/types"

interface DrawingsState {
  drawings: DrawingRow[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  /** Re-fetch from the top (e.g. after a successful submit). */
  reload: () => Promise<void>
}

// Lightweight, self-contained fetcher for the mural. Lives outside
// GalleriesProvider so the drawings query only runs when the Desenhe window
// is actually opened (the hook mounts with the window content).
export function useDrawings(): DrawingsState {
  const [drawings, setDrawings] = useState<DrawingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDrawings([])
      setHasMore(false)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchVisibleDrawings(0)
      setDrawings(rows)
      setHasMore(rows.length === PAGE_SIZE)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error("[drawings] fetch failed:", msg)
      setError(msg)
      setDrawings([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    void (async () => {
      try {
        const next = await fetchVisibleDrawings(drawings.length)
        setDrawings((prev) => {
          // Dedupe by id in case a new row shifted pagination between pages.
          const seen = new Set(prev.map((d) => d.id))
          return [...prev, ...next.filter((d) => !seen.has(d.id))]
        })
        setHasMore(next.length === PAGE_SIZE)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error("[drawings] loadMore failed:", msg)
        setError(msg)
      } finally {
        setLoadingMore(false)
      }
    })()
  }, [drawings.length, hasMore, loadingMore])

  useEffect(() => {
    void reload()
  }, [reload])

  return { drawings, loading, loadingMore, error, hasMore, loadMore, reload }
}
