import { memo, useState, useEffect, useRef, useMemo } from "react"
import { GalleryImage, ImageGallery } from "../../data/galleries"
import { useWindowContext } from "../../contexts/EnhancedWindowContext"
import { cn } from "../../utils/cn"
import { ImageGalleryViewer } from "./ImageGalleryViewer"

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
          src={image.src}
          alt={image.alt}
          className={cn(
            "w-full h-full object-cover group-hover:opacity-90 transition-opacity",
            isLoaded ? "opacity-100" : "opacity-20"
          )}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
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
      } else if (viewportWidth < 1100) {
        // Small desktop screens: compact size
        windowWidth = 240
        windowHeight = 190
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
