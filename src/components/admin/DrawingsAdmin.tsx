import { useCallback, useEffect, useState } from "react"
import {
  deleteDrawing,
  fetchAllDrawings,
  PAGE_SIZE,
  setDrawingHidden,
} from "../../lib/drawings"
import type { DrawingRow } from "../../lib/types"

// Admin moderation for the community pixel-art mural. The admin RLS policy
// returns ALL rows (incl. hidden), so this lists everything and exposes
// hide/unhide + delete.
export function DrawingsAdmin() {
  const [drawings, setDrawings] = useState<DrawingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const rows = await fetchAllDrawings(0)
      setDrawings(rows)
      setHasMore(rows.length === PAGE_SIZE)
    } catch (e) {
      setMsg(`load: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const next = await fetchAllDrawings(drawings.length)
      setDrawings((prev) => {
        const seen = new Set(prev.map((d) => d.id))
        return [...prev, ...next.filter((d) => !seen.has(d.id))]
      })
      setHasMore(next.length === PAGE_SIZE)
    } catch (e) {
      setMsg(`load more: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoadingMore(false)
    }
  }

  async function toggleHidden(d: DrawingRow) {
    setBusyId(d.id)
    setMsg(null)
    try {
      await setDrawingHidden(d.id, !d.hidden)
      setDrawings((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, hidden: !d.hidden } : x)),
      )
    } catch (e) {
      setMsg(`update: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(d: DrawingRow) {
    if (!confirm(`Excluir o desenho de "${d.author_name}"? Não dá pra desfazer.`))
      return
    setBusyId(d.id)
    setMsg(null)
    try {
      await deleteDrawing(d.id)
      setDrawings((prev) => prev.filter((x) => x.id !== d.id))
    } catch (e) {
      setMsg(`delete: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusyId(null)
    }
  }

  const visibleCount = drawings.filter((d) => !d.hidden).length

  return (
    <fieldset>
      <legend>
        Desenhos da comunidade ({visibleCount} visíveis / {drawings.length}{" "}
        carregados)
      </legend>

      <div className="field-row" style={{ marginBottom: 6 }}>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {msg && (
        <p className="text-[11px]" style={{ marginBottom: 6 }}>
          {msg}
        </p>
      )}

      {loading && drawings.length === 0 && <p>Carregando…</p>}
      {!loading && drawings.length === 0 && <p>Nenhum desenho ainda.</p>}

      <div className="flex flex-col gap-1">
        {drawings.map((d) => (
          <div key={d.id} className="admin-row flex gap-2 items-start">
            <img
              src={`data:image/png;base64,${d.png_data}`}
              alt={`Desenho de ${d.author_name}`}
              className="admin-thumb"
              style={{ imageRendering: "pixelated", objectFit: "contain" }}
              loading="lazy"
            />
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="flex items-baseline gap-2">
                <b className="truncate">{d.author_name}</b>
                {d.hidden && (
                  <span style={{ color: "#a00000", fontSize: 10 }}>
                    [oculto]
                  </span>
                )}
              </span>
              {d.message && (
                <span className="text-[11px]" style={{ wordBreak: "break-word" }}>
                  {d.message}
                </span>
              )}
              <span className="text-[10px] text-gray-600">
                {new Date(d.created_at).toLocaleString("pt-BR")}
              </span>
              <div className="field-row" style={{ marginTop: 2 }}>
                <button
                  type="button"
                  disabled={busyId === d.id}
                  onClick={() => void toggleHidden(d)}
                >
                  {d.hidden ? "Mostrar" : "Ocultar"}
                </button>
                <button
                  type="button"
                  disabled={busyId === d.id}
                  onClick={() => void remove(d)}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="field-row" style={{ justifyContent: "center", marginTop: 6 }}>
          <button type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </fieldset>
  )
}
