import { useState, useEffect } from "react"
import { ImageGallery } from "../../data/galleries"
import { cn } from "../../utils/cn"

interface ImageGalleryViewerProps {
  gallery: ImageGallery
  currentImageIndex: number
  className?: string
}

export function ImageGalleryViewer({
  gallery,
  currentImageIndex,
  className,
}: ImageGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex)
  const [imageLoading, setImageLoading] = useState(true)

  const currentImage = gallery.images[currentIndex]
  const totalImages = gallery.images.length

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [totalImages])

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  if (!currentImage) {
    return (
      <div className="p-4 text-center">
        <p>No image found</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "image-gallery-viewer bg-gray-100 flex justify-center",
        className
      )}
    >
      {/* Main Image Display */}
      <div className="relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 border border-gray-400 min-w-[200px] min-h-[150px]">
            <p className="text-sm font-['Pixelated MS Sans Serif']">
              Loading...
            </p>
          </div>
        )}
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          onLoad={handleImageLoad}
          className="w-auto h-auto block"
          style={{
            display: imageLoading ? "none" : "block",
            minWidth: "200px",
            minHeight: "150px",
          }}
        />
      </div>
    </div>
  )
}
