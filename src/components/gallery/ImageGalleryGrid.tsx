import { useState, useEffect, useRef } from "react"
import { GalleryImage, ImageGallery } from "../../data/galleries"
import { useWindowContext } from "../../contexts/WindowContext"
import { cn } from "../../utils/cn"
import { ImageGalleryViewer } from "./ImageGalleryViewer"

interface ImageGalleryGridProps {
  gallery: ImageGallery
  className?: string
}

export function ImageGalleryGrid({
  gallery,
  className,
}: ImageGalleryGridProps) {
  const { openWindow } = useWindowContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Function to determine number of columns based on container width
  const getGridColumns = (width: number): number => {
    if (width < 400) return 2
    if (width < 1000) return 3
    return 6 // 6+ columns for very wide windows
  }

  // Track container width changes and mobile status
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const newWidth = container.offsetWidth
      setContainerWidth(newWidth)
      setIsMobile(window.innerWidth < 768)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        setContainerWidth(newWidth)
        setIsMobile(window.innerWidth < 768)
      }
    })

    resizeObserver.observe(container)
    updateDimensions()

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const columns = getGridColumns(containerWidth)

  const handleImageClick = (image: GalleryImage, index: number) => {
    // Use mobile-optimized sizing for image viewer windows
    const windowSize = isMobile
      ? { width: Math.min(320, window.innerWidth - 20), height: 300 }
      : { width: 400, height: 200 }

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
      size: windowSize,
    })
  }

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
            <div
              key={index}
              className="gallery-image-item cursor-pointer group"
              onClick={() => handleImageClick(image, index)}
            >
              {/* Image container with aspect ratio preservation */}
              <div className="aspect-square bg-gray-200 border border-gray-400 overflow-hidden group-hover:border-blue-400 transition-colors w-full">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  loading="lazy"
                  decoding="async"
                  style={{
                    willChange: "auto", // Prevent unnecessary GPU layers
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
          ))}
        </div>
      </div>
    </div>
  )
}
