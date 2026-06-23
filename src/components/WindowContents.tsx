import { useState } from "react"
import { ImageGalleryGrid } from "./gallery/ImageGalleryGrid"
import { ImageGalleryViewer } from "./gallery/ImageGalleryViewer"
import { TextNoteViewer } from "./content/TextNoteViewer"
import { DesenheWindow } from "./paint/DesenheWindow"
import { useGallery, useGalleries } from "../hooks/useGalleries"

interface WindowContentsProps {
  iconType: string
}

// Maps desktop icon name -> DB gallery id.
// "Desenhe" is intentionally absent: it now opens the interactive Paint app
// (DesenheWindow) instead of a static gallery image.
const ICON_TO_GALLERY: Record<string, string> = {
  Movies: "movies",
  Images: "images",
  "Album Covers": "album-covers",
  Customs: "customs",
  "Pelo mundo": "pelo-mundo",
  Rejects: "rejects",
  "???": "pix",
  Error: "campominado",
}

const SINGLE_IMAGE_VIEWERS: Record<string, string> = {
  "???": "pix-viewer",
  Error: "campominado-viewer",
}

function GalleryFallback({
  loading,
  error,
  onReload,
}: {
  loading: boolean
  error: string | null
  onReload: () => void
}) {
  if (loading) return <div className="p-2"><p>Carregando…</p></div>
  if (error) {
    // The actual error message is already in console.error from useGalleries.
    // Surface a friendly Win98 line, not the raw Supabase string.
    return (
      <div className="p-3 flex flex-col gap-2 items-start">
        <p>Não consegui carregar essa galeria agora.</p>
        <div className="field-row">
          <button onClick={onReload}>Tentar de novo</button>
        </div>
      </div>
    )
  }
  return <div className="p-2"><p>Galeria não encontrada</p></div>
}

function FallbackBanner() {
  return (
    <div
      role="status"
      className="text-xs px-2 py-1 border-b border-[#808080] bg-[#ffffe1]"
    >
      Mostrando conteúdo de demonstração — sem conexão com o servidor.
    </div>
  )
}

export function WindowContents({ iconType }: WindowContentsProps) {
  const [count, setCount] = useState(0)
  const { loading, error, usingFallback, reload } = useGalleries()
  const galleryId = ICON_TO_GALLERY[iconType]
  const gallery = useGallery(galleryId ?? "")

  // Interactive pixel-art Paint app + community mural.
  if (iconType === "Desenhe") {
    return <DesenheWindow />
  }

  // Grid galleries
  if (
    iconType === "Movies" ||
    iconType === "Images" ||
    iconType === "Album Covers" ||
    iconType === "Customs" ||
    iconType === "Pelo mundo" ||
    iconType === "Rejects"
  ) {
    return gallery ? (
      <div className="flex flex-col h-full">
        {usingFallback && <FallbackBanner />}
        <div className="flex-1 min-h-0"><ImageGalleryGrid gallery={gallery} /></div>
      </div>
    ) : (
      <GalleryFallback loading={loading} error={error} onReload={() => void reload()} />
    )
  }

  // Single-image viewers
  if (iconType in SINGLE_IMAGE_VIEWERS) {
    return gallery ? (
      <ImageGalleryViewer
        gallery={gallery}
        currentImageIndex={0}
        windowId={SINGLE_IMAGE_VIEWERS[iconType]}
      />
    ) : (
      <GalleryFallback loading={loading} error={error} onReload={() => void reload()} />
    )
  }

  switch (iconType) {
    case "Computer":
      return (
        <div className="w-full h-full">
          <TextNoteViewer />
        </div>
      )

    case "Counter":
      return (
        <div className="p-2">
          <p style={{ textAlign: "center" }}>Current count: {count}</p>
          <div className="field-row" style={{ justifyContent: "center" }}>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(count - 1)}>-</button>
            <button onClick={() => setCount(0)}>0</button>
          </div>
        </div>
      )

    case "Contato":
      return (
        <div className="p-4">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/icons/envelope_closed-0.png"
              alt="Email"
              width={42}
              height={42}
              className="object-contain"
            />
            <div>
              <a
                href="mailto:francisco.reis.skt@gmail.com"
                className="text-lg font-semibold !text-black hover:underline"
              >
                francisco.reis.skt@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <img
              src="/icons/camera-2.png"
              alt="Social Media"
              width={42}
              height={42}
              className="object-contain"
            />
            <div>
              <a
                href="https://instagram.com/franciscoskt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold !text-black hover:underline block"
              >
                @franciscoskt
              </a>
              <a
                href="https://instagram.com/sktfrancisco"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold !text-black hover:underline block"
              >
                @sktfrancisco
              </a>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="p-2">
          <p>Content for {iconType} window</p>
          <div className="field-row">
            <button>OK</button>
            <button>Cancel</button>
          </div>
        </div>
      )
  }
}
