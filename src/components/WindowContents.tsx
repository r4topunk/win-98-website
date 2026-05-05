import { useState } from "react"
import { ImageGalleryGrid } from "./gallery/ImageGalleryGrid"
import { ImageGalleryViewer } from "./gallery/ImageGalleryViewer"
import { TextNoteViewer } from "./content/TextNoteViewer"
import { useGallery, useGalleries } from "../hooks/useGalleries"

interface WindowContentsProps {
  iconType: string
}

// Maps desktop icon name -> DB gallery id.
const ICON_TO_GALLERY: Record<string, string> = {
  Movies: "movies",
  Images: "images",
  "Album Covers": "album-covers",
  Customs: "customs",
  "Pelo mundo": "pelo-mundo",
  Rejects: "rejects",
  Desenhe: "paint",
  "???": "pix",
  Error: "campominado",
}

const SINGLE_IMAGE_VIEWERS: Record<string, string> = {
  Desenhe: "desenhe",
  "???": "pix-viewer",
  Error: "campominado-viewer",
}

function GalleryFallback({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="p-2"><p>Loading...</p></div>
  if (error) return <div className="p-2"><p>Error: {error}</p></div>
  return <div className="p-2"><p>Gallery not found</p></div>
}

export function WindowContents({ iconType }: WindowContentsProps) {
  const [count, setCount] = useState(0)
  const { loading, error } = useGalleries()
  const galleryId = ICON_TO_GALLERY[iconType]
  const gallery = useGallery(galleryId ?? "")

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
      <ImageGalleryGrid gallery={gallery} />
    ) : (
      <GalleryFallback loading={loading} error={error} />
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
      <GalleryFallback loading={loading} error={error} />
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
