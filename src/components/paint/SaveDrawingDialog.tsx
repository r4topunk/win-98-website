import { useEffect, useRef, useState } from "react"
import {
  MAX_MESSAGE_LEN,
  MAX_NAME_LEN,
  submitDrawing,
} from "../../lib/drawings"

interface Props {
  /** Full data URL of the just-drawn art, for the preview thumbnail. */
  previewSrc: string
  /** RAW base64 (no prefix) to persist. */
  pngData: string
  onCancel: () => void
  onSaved: () => void
}

// Win98-style modal that collects the author name + message after the user
// finishes a drawing, then submits it. Overlays the Desenhe window content.
export function SaveDrawingDialog({ previewSrc, pngData, onCancel, onSaved }: Props) {
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // Autofocus the name field; Esc cancels (unless mid-submit).
  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [busy, onCancel])

  const trimmedName = name.trim()
  const canSubmit =
    !busy &&
    trimmedName.length >= 1 &&
    trimmedName.length <= MAX_NAME_LEN &&
    message.length <= MAX_MESSAGE_LEN

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const result = await submitDrawing({
      authorName: trimmedName,
      message: message.trim(),
      pngData,
    })
    setBusy(false)
    if (result.ok) onSaved()
    else setError(result.message)
  }

  return (
    <div
      // Backdrop covers the window content. Clicking it does nothing (Win98
      // modals are dismissed via the X / Cancel) so a drawing isn't lost by a
      // stray click.
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        overflow: "auto",
        zIndex: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Salvar desenho"
        className="window"
        style={{
          width: 300,
          maxWidth: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="title-bar">
          <div className="title-bar-text">Salvar desenho</div>
          <div className="title-bar-controls">
            <button aria-label="Close" disabled={busy} onClick={onCancel} />
          </div>
        </div>
        <div
          className="window-body"
          style={{
            margin: 6,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col text-xs"
            style={{ flex: 1, minHeight: 0 }}
          >
            {/* Scrollable middle — keeps the title bar + footer buttons in view
                even when the Desenhe window is short (mobile). */}
            <div
              className="flex flex-col gap-2"
              style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
            >
              <div className="flex gap-2 items-start">
                <img
                  src={previewSrc}
                  alt="Prévia do seu desenho"
                  width={64}
                  height={64}
                  style={{
                    width: 64,
                    height: 64,
                    imageRendering: "pixelated",
                    border: "1px solid #808080",
                    background: "#fff",
                    flexShrink: 0,
                  }}
                />
                <p style={{ color: "#444" }}>
                  Quase lá! Coloque seu nome e um recado para o desenho aparecer
                  no Mural.
                </p>
              </div>

              <div className="field-row-stacked">
                <label htmlFor="save-name">
                  Seu nome ({trimmedName.length}/{MAX_NAME_LEN})
                </label>
                <input
                  id="save-name"
                  ref={nameRef}
                  type="text"
                  value={name}
                  maxLength={MAX_NAME_LEN}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como você quer aparecer"
                  disabled={busy}
                />
              </div>

              <div className="field-row-stacked">
                <label htmlFor="save-message">
                  Mensagem ({message.length}/{MAX_MESSAGE_LEN})
                </label>
                <textarea
                  id="save-message"
                  value={message}
                  maxLength={MAX_MESSAGE_LEN}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Deixe um recado (opcional)"
                  rows={2}
                  disabled={busy}
                  style={{ resize: "none", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <p role="alert" style={{ color: "#a00000" }}>
                  {error}
                </p>
              )}
            </div>

            {/* Fixed footer */}
            <div
              className="field-row"
              style={{
                justifyContent: "flex-end",
                gap: 6,
                flexShrink: 0,
                marginTop: 8,
              }}
            >
              <button type="button" onClick={onCancel} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" disabled={!canSubmit}>
                {busy ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
