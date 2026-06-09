import { useState, useEffect, useRef } from "react"
import type { ImageGallery } from "../../lib/types"
import { cn } from "../../utils/cn"
import { useWindowContext } from "../../contexts/EnhancedWindowContext"

interface ImageGalleryViewerProps {
  gallery: ImageGallery
  currentImageIndex: number
  className?: string
  windowId?: string
}

export function ImageGalleryViewer({
  gallery,
  currentImageIndex,
  className,
  windowId,
}: ImageGalleryViewerProps) {
  const { windows, activeWindowId, openWindow } = useWindowContext()
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex)
  const [imageLoading, setImageLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Find the current window to check if it's fullscreen
  const currentWindow = windowId ? windows.find(w => w.id === windowId) : null
  const isFullscreen = currentWindow?.isFullscreen || false
  // Only this viewer's keyboard listener should fire when its window is on
  // top. Without this gate, every open viewer plus the admin form steal
  // ArrowLeft/Right keys from the focused input.
  const isActiveWindow = windowId ? activeWindowId === windowId : true

  const currentImage = gallery.images[currentIndex]
  const totalImages = gallery.images.length
  const hasMultiple = totalImages > 1

  // Navigate to previous image
  const goToPrevious = () => {
    setImageLoading(true)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1))
  }

  // Navigate to next image
  const goToNext = () => {
    setImageLoading(true)
    setCurrentIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0))
  }

  // Keyboard navigation — scoped to the active window so a viewer hidden
  // behind admin / another window doesn't hijack arrow keys.
  useEffect(() => {
    if (!isActiveWindow) return
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't steal keys from focused form fields anywhere on the page.
      const t = event.target as HTMLElement | null
      if (t) {
        const tag = t.tagName
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          (t as HTMLElement).isContentEditable
        ) {
          return
        }
      }
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          goToPrevious()
          break
        case "ArrowRight":
          event.preventDefault()
          goToNext()
          break
        case "Home":
          event.preventDefault()
          setImageLoading(true)
          setCurrentIndex(0)
          break
        case "End":
          event.preventDefault()
          setImageLoading(true)
          setCurrentIndex(totalImages - 1)
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [totalImages, isActiveWindow])

  // Touch swipe: dominant horizontal motion (>40 px, >2× the vertical) flips
  // the page. Lets a phone visitor leaf through a gallery without on-screen
  // chevrons; the chevrons stay as the discoverable fallback.
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0]
    if (!t) return
    touchStartXRef.current = t.clientX
    touchStartYRef.current = t.clientY
  }
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    touchStartXRef.current = null
    touchStartYRef.current = null
    if (startX == null || startY == null) return
    const t = e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 2) return
    if (dx < 0) goToNext()
    else goToPrevious()
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url)
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "").split("/")[0] || null
      }
      if (u.searchParams.get("v")) {
        return u.searchParams.get("v")
      }
      if (u.pathname.startsWith("/shorts/")) {
        const parts = u.pathname.split("/")
        return parts[2] || null
      }
      if (u.pathname.startsWith("/embed/")) {
        const parts = u.pathname.split("/")
        return parts[2] || null
      }
      return null
    } catch {
      return null
    }
  }

  // Handle YouTube link click
  const handleYouTubeClick = () => {
    if (!currentImage.link) return

    const youtubeId = extractYouTubeId(currentImage.link)
    if (youtubeId) {
      const embedUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`
      
      // Use sensible fixed sizes for video windows
      const viewportWidth = window.innerWidth
      
      let videoWidth: number
      let videoHeight: number
      
      if (isMobile || viewportWidth < 768) {
        // Mobile: compact video size
        videoWidth = 320
        videoHeight = 180 // 16:9 aspect ratio
      } else if (viewportWidth < 1150) {
        // Small desktop: compact video size
        videoWidth = 300
        videoHeight = 169 // 16:9 aspect ratio
      } else if (viewportWidth < 1400) {
        // Medium screens: medium video size
        videoWidth = 480
        videoHeight = 270 // 16:9 aspect ratio
      } else {
        // Large screens: larger video size
        videoWidth = 600
        videoHeight = 337 // 16:9 aspect ratio
      }
      
      openWindow({
        // Stable id per video so clicking "Watch video" a second time focuses
        // the existing window instead of spawning a duplicate.
        id: `youtube-${youtubeId}`,
        title: `YouTube - ${currentImage.title || 'Video'}`,
        content: (
          <div className="w-full h-full">
            <iframe
              title={currentImage.title || 'YouTube Video'}
              src={embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ),
        size: { width: videoWidth, height: videoHeight },
      })

      // Keep current image window open - no need to duplicate as it's already open
    } else {
      // Fallback: open original YouTube link
      window.open(currentImage.link, '_blank')
    }
  }

  if (!currentImage) {
    return (
      <div className="p-4 text-center">
        <p>No image found</p>
      </div>
    )
  }

  // The viewer is opened with noScroll: true, which renders the window's
  // inner container at height: auto. flex-1 inside an auto-height parent
  // collapses to 0, so we set an explicit pixel height from the window's
  // own size (minus title bar). Fullscreen uses 100% because OptimizedWindow
  // already gives the noScroll container `calc(100% - 30px)`.
  const viewerHeight = isFullscreen
    ? "100%"
    : currentWindow?.size?.height
      ? `${currentWindow.size.height - 30}px`
      : undefined

  return (
    <div
      className={cn(
        "image-gallery-viewer bg-gray-100 flex flex-col w-full overflow-hidden",
        className
      )}
      style={{ height: viewerHeight }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image Display */}
      <div className={cn(
        "relative flex-1 min-h-0",
        isFullscreen ? "flex justify-center items-center w-full" : "w-full flex justify-center items-center"
      )}>
        {imageLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center bg-gray-200 border border-gray-400",
            !isFullscreen && "min-w-[200px] min-h-[150px]"
          )}>
            <p className="text-sm font-['Pixelated MS Sans Serif']">
              Carregando…
            </p>
          </div>
        )}
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          onLoad={handleImageLoad}
          className={cn(
            isFullscreen ? "max-w-full max-h-full object-contain" : "h-auto block"
          )}
          style={{
            display: imageLoading ? "none" : "block",
            ...(isFullscreen ? {} : {
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }),
          }}
        />

        {/* Spotify button for images with Spotify links */}
        {currentImage.link && currentImage.link.includes('spotify.com') && !imageLoading && (
          <button
            className="absolute bottom-10 left-2 right-2 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 font-['Pixelated MS Sans Serif'] border border-green-700 transition-colors duration-200"
            onClick={() => window.open(currentImage.link, '_blank')}
          >
            Abrir no Spotify
          </button>
        )}

        {/* YouTube button for images with YouTube links */}
        {currentImage.link && (currentImage.link.includes('youtube.com') || currentImage.link.includes('youtu.be')) && !imageLoading && (
          <button
            className="absolute top-2 left-2 right-2 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 font-['Pixelated MS Sans Serif'] border border-red-800 transition-colors duration-200"
            onClick={handleYouTubeClick}
          >
            Assistir vídeo
          </button>
        )}

        {/* Pix viewer is decorative — render a non-interactive label so Tab
            users don't land on a button that does nothing. */}
        {windowId === 'pix-viewer' && !imageLoading && (
          <div
            className="absolute top-2 left-2 right-2 bg-blue-600 text-white text-sm py-2 px-4 font-['Pixelated MS Sans Serif'] border border-blue-800 text-center"
            aria-hidden="true"
          >
            me paga um almoço aí jjjkkkkk
          </div>
        )}
      </div>

      {/* Win98-style status bar: prev / counter / next. Hidden for
          single-image viewers (Pix, Desenhe, Error) where it would just
          show "1/1". */}
      {hasMultiple && (
        <div
          className="status-bar flex items-stretch select-none"
          style={{ borderTop: "1px solid #808080", boxShadow: "inset 0 1px #fff" }}
        >
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Imagem anterior"
            className="px-3 py-0.5 text-sm font-['Pixelated MS Sans Serif']"
            title="Anterior (←)"
          >
            ‹
          </button>
          <div className="flex-1 status-bar-field text-center font-['Pixelated MS Sans Serif']">
            {currentIndex + 1} / {totalImages}
            {currentImage.title ? ` · ${currentImage.title}` : ""}
          </div>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Próxima imagem"
            className="px-3 py-0.5 text-sm font-['Pixelated MS Sans Serif']"
            title="Próxima (→)"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
