import { useState } from "react"
import { PixelPaintEditor } from "./PixelPaintEditor"
import { DrawingMural } from "./DrawingMural"
import { SaveDrawingDialog } from "./SaveDrawingDialog"
import { useDrawings } from "../../hooks/useDrawings"

type Tab = "draw" | "mural"

interface PendingSave {
  pngData: string
  dataUrl: string
}

export function DesenheWindow() {
  const [tab, setTab] = useState<Tab>("draw")
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null)
  const [resetToken, setResetToken] = useState(0)
  const drawings = useDrawings()

  const handleSaved = () => {
    void drawings.reload()
    setPendingSave(null)
    setResetToken((t) => t + 1) // clears the editor canvas
    setTab("mural")
  }

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ background: "#c0c0c0" }}
    >
      {/* Win98 menu/tab strip */}
      <menu
        role="tablist"
        aria-label="Modo do Paint"
        className="m-0 p-1 flex gap-1"
        style={{ borderBottom: "1px solid #808080", listStyle: "none" }}
      >
        <button
          role="tab"
          aria-selected={tab === "draw"}
          className={tab === "draw" ? "active" : ""}
          onClick={() => setTab("draw")}
        >
          Desenhar
        </button>
        <button
          role="tab"
          aria-selected={tab === "mural"}
          className={tab === "mural" ? "active" : ""}
          onClick={() => setTab("mural")}
        >
          Mural{drawings.drawings.length ? ` (${drawings.drawings.length})` : ""}
        </button>
      </menu>

      <div className="flex-1 min-h-0 overflow-auto">
        {tab === "draw" ? (
          <PixelPaintEditor
            resetToken={resetToken}
            onRequestSave={(pngData, dataUrl) =>
              setPendingSave({ pngData, dataUrl })
            }
          />
        ) : (
          <DrawingMural
            drawings={drawings.drawings}
            loading={drawings.loading}
            loadingMore={drawings.loadingMore}
            error={drawings.error}
            hasMore={drawings.hasMore}
            onLoadMore={drawings.loadMore}
          />
        )}
      </div>

      {pendingSave && (
        <SaveDrawingDialog
          previewSrc={pendingSave.dataUrl}
          pngData={pendingSave.pngData}
          onCancel={() => setPendingSave(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
