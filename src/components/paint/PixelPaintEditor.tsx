import { useCallback, useEffect, useRef, useState } from "react"
import { CANVAS_SIZE, MAX_PNG_LEN } from "../../lib/drawings"

// Classic VGA / Win98 16-color palette.
const PALETTE = [
  "#000000", "#808080", "#800000", "#808000",
  "#008000", "#008080", "#000080", "#800080",
  "#ffffff", "#c0c0c0", "#ff0000", "#ffff00",
  "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
]

const BG = "#ffffff" // canvas background; the eraser paints this.

// Cap the undo stack so a long session can't grow memory without bound.
// Each snapshot is CANVAS_SIZE² × 4 bytes (16 KB at 64px), so 50 ≈ 800 KB.
const MAX_HISTORY = 50

interface Props {
  /**
   * Called when the user finishes a drawing and clicks save. Hands the parent
   * the encoded art so it can open the name/message modal. `dataUrl` is the
   * full `data:image/png;base64,...` (for preview); `pngData` is RAW base64.
   */
  onRequestSave: (pngData: string, dataUrl: string) => void
  /** Bumping this value clears the canvas (e.g. after a successful save). */
  resetToken?: number
}

export function PixelPaintEditor({ onRequestSave, resetToken = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawingRef = useRef(false)
  const lastCellRef = useRef<{ x: number; y: number } | null>(null)
  // Snapshots taken just before each stroke begins; one entry = one undo step.
  const historyRef = useRef<ImageData[]>([])

  const [color, setColor] = useState(PALETTE[0])
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil")
  const [hasDrawn, setHasDrawn] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fillWhite = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [])

  const clearHistory = useCallback(() => {
    historyRef.current = []
    setCanUndo(false)
  }, [])

  // Capture the canvas as it is *before* the next stroke, so undo can restore it.
  const pushHistory = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    historyRef.current.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE))
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
    setCanUndo(true)
  }, [])

  const undo = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const prev = historyRef.current.pop()
    if (!prev) return
    // Abort any in-progress stroke so the restored state isn't immediately drawn over.
    drawingRef.current = false
    lastCellRef.current = null
    ctx.putImageData(prev, 0, 0)
    setCanUndo(historyRef.current.length > 0)
    setHasDrawn(historyRef.current.length > 0)
    setError(null)
  }, [])

  // Initialize the backing buffer to a white canvas on mount.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctxRef.current = ctx
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [])

  // Clear when the parent bumps resetToken (after a successful save).
  useEffect(() => {
    if (resetToken === 0) return
    fillWhite()
    clearHistory()
    setHasDrawn(false)
    setError(null)
  }, [resetToken, fillWhite, clearHistory])

  // Ctrl/Cmd+Z to undo. Scoped to window but only while this editor is mounted
  // (the parent unmounts it when the Mural tab is shown), and ignored while the
  // user is typing in a form field so text undo still works in the save dialog.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return
      if (e.key.toLowerCase() !== "z") return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable)
        return
      e.preventDefault()
      undo()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [undo])

  const paintCell = useCallback(
    (x: number, y: number) => {
      const ctx = ctxRef.current
      if (!ctx) return
      if (x < 0 || y < 0 || x >= CANVAS_SIZE || y >= CANVAS_SIZE) return
      ctx.fillStyle = tool === "eraser" ? BG : color
      ctx.fillRect(x, y, 1, 1)
    },
    [color, tool],
  )

  // Bresenham line so fast pointer moves don't leave gaps between samples.
  const paintLine = useCallback(
    (x0: number, y0: number, x1: number, y1: number) => {
      const dx = Math.abs(x1 - x0)
      const dy = Math.abs(y1 - y0)
      const sx = x0 < x1 ? 1 : -1
      const sy = y0 < y1 ? 1 : -1
      let err = dx - dy
      let cx = x0
      let cy = y0
      for (;;) {
        paintCell(cx, cy)
        if (cx === x1 && cy === y1) break
        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          cx += sx
        }
        if (e2 < dx) {
          err += dx
          cy += sy
        }
      }
    },
    [paintCell],
  )

  const cellFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * CANVAS_SIZE)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * CANVAS_SIZE)
    return {
      x: Math.max(0, Math.min(CANVAS_SIZE - 1, x)),
      y: Math.max(0, Math.min(CANVAS_SIZE - 1, y)),
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const cell = cellFromEvent(e)
    if (!cell) return
    canvasRef.current?.setPointerCapture(e.pointerId)
    pushHistory() // snapshot the pre-stroke canvas for undo
    drawingRef.current = true
    lastCellRef.current = cell
    paintCell(cell.x, cell.y)
    setHasDrawn(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const cell = cellFromEvent(e)
    if (!cell) return
    const last = lastCellRef.current
    if (last) paintLine(last.x, last.y, cell.x, cell.y)
    else paintCell(cell.x, cell.y)
    lastCellRef.current = cell
  }

  const stopDrawing = () => {
    drawingRef.current = false
    lastCellRef.current = null
  }

  const clearCanvas = () => {
    fillWhite()
    clearHistory()
    setHasDrawn(false)
    setError(null)
  }

  const handleSave = () => {
    if (!hasDrawn) return
    const canvas = canvasRef.current
    if (!canvas) return
    // Canonicalize to a genuine PNG via the browser encoder.
    const dataUrl = canvas.toDataURL("image/png")
    const pngData = dataUrl.split(",")[1] ?? ""
    if (pngData.length > MAX_PNG_LEN) {
      setError("Desenho muito grande para salvar.")
      return
    }
    setError(null)
    onRequestSave(pngData, dataUrl)
  }

  return (
    <div
      className="flex flex-col gap-2 p-2 text-xs mx-auto w-full h-full"
      style={{ maxWidth: 460, boxSizing: "border-box" }}
    >
      {/* Toolbar */}
      <div className="field-row" style={{ gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          className={tool === "pencil" ? "active" : ""}
          aria-pressed={tool === "pencil"}
          onClick={() => setTool("pencil")}
          title="Lápis"
        >
          ✏️ Lápis
        </button>
        <button
          type="button"
          className={tool === "eraser" ? "active" : ""}
          aria-pressed={tool === "eraser"}
          onClick={() => setTool("eraser")}
          title="Borracha"
        >
          ⬜ Borracha
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Desfazer (Ctrl/Cmd+Z)"
        >
          ↶ Desfazer
        </button>
        <button type="button" onClick={clearCanvas} title="Limpar tudo">
          🗑️ Limpar
        </button>
        <span
          aria-hidden="true"
          title={`Cor atual: ${color}`}
          style={{
            width: 18,
            height: 18,
            background: color,
            border: "1px solid #000",
            boxShadow: "inset -1px -1px #fff, inset 1px 1px #808080",
            display: "inline-block",
          }}
        />
      </div>

      {/* Palette */}
      <div
        role="group"
        aria-label="Paleta de cores"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: 2,
          width: "100%",
          flexShrink: 0,
        }}
      >
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor ${c}`}
            aria-pressed={color === c && tool === "pencil"}
            title={c}
            onClick={() => {
              setColor(c)
              setTool("pencil")
            }}
            style={{
              height: 20,
              minWidth: 0,
              padding: 0,
              background: c,
              border:
                color === c && tool === "pencil"
                  ? "2px solid #000080"
                  : "1px solid #404040",
            }}
          />
        ))}
      </div>

      {/* Canvas — grows to fill the remaining space as a centered square. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            height: "100%",
            aspectRatio: "1 / 1",
            maxWidth: "100%",
            maxHeight: "100%",
            border: "none",
            boxShadow:
              "inset -1px -1px #fff, inset 1px 1px #808080, inset -2px -2px #dfdfdf, inset 2px 2px #0a0a0a",
            background: "#fff",
            padding: 2,
            boxSizing: "border-box",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            aria-label="Área de desenho de pixel art"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              imageRendering: "pixelated",
              touchAction: "none",
              cursor: "crosshair",
            }}
          />
        </div>
      </div>

      <div
        className="field-row"
        style={{ justifyContent: "space-between", flexShrink: 0 }}
      >
        <button type="button" onClick={handleSave} disabled={!hasDrawn}>
          Salvar no Mural…
        </button>
        {!hasDrawn && (
          <span style={{ color: "#444" }}>Desenhe algo primeiro 🙂</span>
        )}
      </div>

      {error && (
        <p role="alert" style={{ color: "#a00000" }}>
          {error}
        </p>
      )}
    </div>
  )
}
