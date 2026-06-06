import { memo, useState, useEffect, useRef, useMemo } from "react"
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
  onClick
}: {
  image: GalleryImage
  index: number
  onClick: (image: GalleryImage, index: number) => void
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
          onLoad={() => setIsLoaded(true)}
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

  const handleImageClick = useMemo(() => 
    (image: GalleryImage, index: number) => {
      // Use sensible fixed sizes for different screen categories
      const viewportWidth = window.innerWidth
      
      let windowWidth: number
      let windowHeight: number
      
      if (isMobile || viewportWidth < 768) {
        // Mobile screens: compact size
        windowWidth = 300
        windowHeight = 250
      } else if (viewportWidth < 1150) {
        // Small desktop screens: smaller size
        windowWidth = 200
        windowHeight = 160
      } else if (viewportWidth < 1400) {
        // Medium desktop screens: medium size
        windowWidth = 320
        windowHeight = 240
      } else {
        // Large desktop screens: larger size
        windowWidth = 360
        windowHeight = 280
      }

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
        noScroll: true, // Disable scroll to let image display at natural height
        size: { width: windowWidth, height: windowHeight },
      })
    }, [gallery, isMobile, openWindow]
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
            />
          ))}
        </div>
      </div>
    </div>
  )
})

VirtualImageGrid.displayName = "VirtualImageGrid"
