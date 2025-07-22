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

  // Function to determine number of columns based on container width
  const getGridColumns = (width: number): number => {
    if (width < 400) return 2
    if (width < 600) return 3
    if (width < 800) return 4
    if (width < 1000) return 5
    return 6 // 6+ columns for very wide windows
  }

  // Track container width changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        console.log(`🖼️ Gallery "${gallery.name}" container resized:`, {
          width: newWidth,
          columns: getGridColumns(newWidth),
        })
        setContainerWidth(newWidth)
      }
    })

    resizeObserver.observe(container)
    // Set initial width
    setContainerWidth(container.offsetWidth)

    return () => resizeObserver.disconnect()
  }, [])

  const columns = getGridColumns(containerWidth)

  const handleImageClick = (image: GalleryImage, index: number) => {
    // Open image viewer window with 400px width and auto height
    openWindow({
      id: `${gallery.id}-viewer-${index}`,
      title: `${gallery.name} - ${image.title || `Image ${index + 1}`}`,
      content: (
        <ImageGalleryViewer gallery={gallery} currentImageIndex={index} />
      ),
      noScroll: true, // Disable scroll to let image display at natural height
      size: { width: 400, height: 200 }, // Set window width to 400px, minimal height (will grow with image)
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
                    maxWidth: "200px",
                    maxHeight: "200px",
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

      {/* Gallery info */}
      <div className="p-2 border-t border-gray-400 bg-gray-100 flex-shrink-0">
        <p className="text-sm font-['Pixelated MS Sans Serif']">
          {gallery.images.length} image{gallery.images.length !== 1 ? "s" : ""}{" "}
          in {gallery.name}
        </p>
      </div>
    </div>
  )
}
