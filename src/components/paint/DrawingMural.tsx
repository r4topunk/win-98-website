import type { DrawingRow } from "../../lib/types"

interface Props {
  drawings: DrawingRow[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  onLoadMore: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  } catch {
    return ""
  }
}

function DrawingCard({ d }: { d: DrawingRow }) {
  return (
    <figure
      className="m-0 flex flex-col gap-1"
      style={{
        border: "1px solid #fff",
        boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #808080",
        background: "#c0c0c0",
        padding: 6,
      }}
    >
      {/* SAFE RENDER: prefix is a hardcoded literal; png_data is RAW base64
          (DB CHECK forbids ':'), so no data: scheme can be smuggled in. Only
          ever rendered via <img>, never a navigable context. */}
      <img
        src={`data:image/png;base64,${d.png_data}`}
        alt={`Desenho de ${d.author_name}`}
        width={128}
        height={128}
        loading="lazy"
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "1 / 1",
          imageRendering: "pixelated",
          background: "#fff",
          border: "1px solid #808080",
        }}
      />
      <figcaption className="flex flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          {/* JSX text child — React auto-escapes; never an attribute/HTML sink. */}
          <b className="truncate">{d.author_name}</b>
          <span style={{ color: "#444", fontSize: 10, flexShrink: 0 }}>
            {formatDate(d.created_at)}
          </span>
        </span>
        {d.message && (
          <span style={{ wordBreak: "break-word" }}>{d.message}</span>
        )}
      </figcaption>
    </figure>
  )
}

export function DrawingMural({
  drawings,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
}: Props) {
  if (loading) {
    return (
      <div className="p-3 text-xs">
        <p>Carregando o mural…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 text-xs">
        <p>Não consegui carregar o mural agora.</p>
      </div>
    )
  }

  if (drawings.length === 0) {
    return (
      <div className="p-3 text-xs flex flex-col gap-1">
        <p>Ainda não tem nenhum desenho no mural.</p>
        <p style={{ color: "#444" }}>Seja o primeiro — vá na aba “Desenhar”!</p>
      </div>
    )
  }

  return (
    <div className="p-2 text-xs flex flex-col gap-2">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: 8,
        }}
      >
        {drawings.map((d) => (
          <DrawingCard key={d.id} d={d} />
        ))}
      </div>
      {hasMore && (
        <div className="field-row" style={{ justifyContent: "center" }}>
          <button type="button" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  )
}
