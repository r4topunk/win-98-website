import { memo, useState, useEffect, useRef, useMemo, useCallback } from "react"
import type { GalleryImage, ImageGallery } from "../../lib/types"
import { useWindowContext } from "../../contexts/EnhancedWindowContext"
import { cn } from "../../utils/cn"
import { ImageGalleryViewer } from "./ImageGalleryViewer"
import { publicImageUrl } from "../../lib/supabase"
import { thumbStoragePath } from "../../lib/imageThumb"

// Pick a thumbnail URL by mirroring the same `<base>-thumb.webp` convention
// in both places we host images:
//  - Local /site_images/<folder>/<name>.<ext> → sibling produced by
//    scripts/gen-thumbs.ts at build/dev time.
//  - Supabase Storage assets → sibling produced by AdminPanel on upload
//    (see src/lib/imageThumb.ts).
// External URLs we don't control pass through. onError below falls back to
// the master if the thumb 404s (e.g. legacy rows uploaded before this).
function thumbSrc(image: GalleryImage): string {
  if (image.storagePath) {
    return publicImageUrl(thumbStoragePath(image.storagePath))
  }
  const src = image.src
  if (!src.startsWith("/site_images/")) return src
  const dot = src.lastIndexOf(".")
  if (dot === -1) return src
  return `${src.slice(0, dot)}-thumb.webp`
}

interface VirtualImageGridProps {
  gallery: ImageGallery
  className?: string
}

// Memoized image component to prevent unnecessary re-renders
const MemoizedImageItem = memo(({
  image,
  index,
  onClick,
  onDims,
}: {
  image: GalleryImage
  index: number
  onClick: (image: GalleryImage, index: number) => void
  // Capture the thumbnail's natural dimensions so the click handler can
  // size the viewer window with the correct aspect ratio. Thumbnails are
  // proportional scaledowns of the masters, so naturalWidth/Height share
  // the same aspect as the master.
  onDims: (index: number, w: number, h: number) => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className="gallery-image-item cursor-pointer group"
      onClick={() => onClick(image, index)}
    >
      {/* Image container with aspect ratio preservation */}
      <div className="aspect-square bg-gray-200 border border-gray-400 overflow-hidden group-hover:border-blue-400 transition-colors w-full">
        <img
          src={thumbSrc(image)}
          alt={image.alt}
          className={cn(
            "w-full h-full object-cover group-hover:opacity-90 transition-opacity",
            isLoaded ? "opacity-100" : "opacity-20"
          )}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            setIsLoaded(true)
            const img = e.currentTarget
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              onDims(index, img.naturalWidth, img.naturalHeight)
            }
          }}
          onError={(e) => {
            // Fall back to the full-res master if the thumb is missing
            // (e.g. a newly-added image not yet processed by `pnpm thumbs`).
            const img = e.currentTarget
            if (img.src !== window.location.origin + image.src && img.src !== image.src) {
              img.src = image.src
            }
          }}
          style={{
            willChange: "auto",
          }}
        />
      </div>

      {/* Image title/caption */}
      {image.title && (
        <p className="text-xs mt-1 text-center truncate font-['Pixelated MS Sans Serif'] px-1">
          {image.title}
        </p>
      )}
    </div>
  )
})

MemoizedImageItem.displayName = "MemoizedImageItem"

// Virtual scrolling image grid for better performance with large galleries
export const VirtualImageGrid = memo(({ gallery, className }: VirtualImageGridProps) => {
  const { openWindow } = useWindowContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Function to determine number of columns based on container width
  const getGridColumns = (width: number): number => {
    if (width < 400) return 2
    if (width < 500) return 3  // Small desktop range
    if (width < 700) return 4  // Medium desktop range
    if (width < 1000) return 5
    return 6 // Large desktop
  }

  // Optimized resize tracking with debouncing
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeoutId: number
    
    const updateDimensions = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const newWidth = container.offsetWidth
        setContainerWidth(newWidth)
        setIsMobile(window.innerWidth < 768)
      }, 16) // 16ms debounce for smooth updates
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(container)
    updateDimensions()

    const handleResize = () => updateDimensions()
    window.addEventListener("resize", handleResize)
    
    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const columns = useMemo(() => getGridColumns(containerWidth), [containerWidth])

  // Stores (index → naturalWidth/Height) captured from each thumbnail's
  // onLoad. Ref instead of state — we only read it at click time and don't
  // want a re-render every time a thumb finishes loading.
  const naturalDimsRef = useRef<Map<number, { w: number; h: number }>>(new Map())
  const recordNaturalDims = useCallback((index: number, w: number, h: number) => {
    naturalDimsRef.current.set(index, { w, h })
  }, [])

  const handleImageClick = useCallback(
    (image: GalleryImage, index: number) => {
      // Open each viewer at a size that matches the image's aspect ratio,
      // so a square painting gets a square window, a portrait photo gets a
      // tall window, a wide landscape gets a wide window. Aspect comes from
      // DB metadata (image.width/height) first, then from the thumbnail's
      // natural dimensions captured on load. If neither is available we
      // fall back to a comfortable landscape default.
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const isPhone = isMobile || viewportWidth < 768

      // Chrome that doesn't show the image
      const TITLE_BAR = 30
      const STATUS_BAR = gallery.images.length > 1 ? 24 : 0
      const CHROME_H = TITLE_BAR + STATUS_BAR

      // Outer bounds — the window never gets bigger than the visible
      // desktop. Multiplier > 0.8 leaves room for the taskbar / margins.
      const maxW = isPhone
        ? viewportWidth - 20
        : Math.min(Math.round(viewportWidth * 0.85), 1100)
      const maxH = isPhone
        ? viewportHeight - 100
        : Math.min(Math.round(viewportHeight * 0.85), 800)
      // Floor — chrome (title bar, status bar, close X) needs to stay
      // readable and tappable even for tiny stamp-sized originals.
      const minW = isPhone ? 280 : 360
      const minH = isPhone ? 260 : 280
      const maxImageH = maxH - CHROME_H

      // Source of truth for aspect ratio
      const fromMeta =
        image.width && image.height
          ? { w: image.width, h: image.height }
          : null
      const fromGrid = naturalDimsRef.current.get(index)
      const dims = fromMeta || fromGrid

      let windowWidth: number
      let windowHeight: number

      if (dims) {
        const aspect = dims.w / dims.h
        // Try fitting by width first
        let imgW = Math.min(dims.w, maxW)
        let imgH = imgW / aspect
        // If too tall, fit by height
        if (imgH > maxImageH) {
          imgH = maxImageH
          imgW = imgH * aspect
        }
        windowWidth = Math.round(imgW)
        windowHeight = Math.round(imgH + CHROME_H)
      } else {
        // Aspect unknown — use a sensible landscape default that's bigger
        // than the old 200×160 but doesn't dominate the desktop.
        windowWidth = isPhone ? Math.min(maxW, 500) : Math.min(maxW, 800)
        windowHeight = isPhone ? Math.min(maxH, 520) : Math.min(maxH, 600)
      }

      // Final bounds clamp
      windowWidth = Math.min(Math.max(windowWidth, minW), maxW)
      windowHeight = Math.min(Math.max(windowHeight, minH), maxH)

      const windowId = `${gallery.id}-viewer-${index}`

      openWindow({
        id: windowId,
        title: `${gallery.name} - ${image.title || `Image ${index + 1}`}`,
        content: (
          <ImageGalleryViewer
            gallery={gallery}
            currentImageIndex={index}
            windowId={windowId}
          />
        ),
        noScroll: true,
        size: { width: windowWidth, height: windowHeight },
      })
    },
    [gallery, isMobile, openWindow]
  )

  return (
    <div className={cn("image-gallery-grid h-full flex flex-col", className)}>
      {/* Grid layout that adapts to window size */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2">
        <div
          className="grid gap-2 sm:gap-3 max-w-full"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {gallery.images.map((image, index) => (
            <MemoizedImageItem
              key={`${gallery.id}-${index}`}
              image={image}
              index={index}
              onClick={handleImageClick}
              onDims={recordNaturalDims}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

VirtualImageGrid.displayName = "VirtualImageGrid"
