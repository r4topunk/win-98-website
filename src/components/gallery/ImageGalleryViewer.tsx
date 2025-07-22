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
    <div className={cn("image-gallery-viewer h-full flex flex-col", className)}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-400">
        <button
          onClick={goToPrevious}
          className="px-3 py-1 bg-gray-300 border border-gray-400 hover:bg-gray-400 transition-colors"
          disabled={totalImages <= 1}
        >
          ← Previous
        </button>

        <span className="text-sm font-['Pixelated MS Sans Serif']">
          {currentIndex + 1} of {totalImages}
        </span>

        <button
          onClick={goToNext}
          className="px-3 py-1 bg-gray-300 border border-gray-400 hover:bg-gray-400 transition-colors"
          disabled={totalImages <= 1}
        >
          Next →
        </button>
      </div>

      {/* Main Image Display */}
      <div className="flex-1 flex items-center justify-center p-2 bg-gray-100 min-h-0">
        <div className="relative max-w-full max-h-full">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 border border-gray-400">
              <p className="text-sm font-['Pixelated MS Sans Serif']">
                Loading...
              </p>
            </div>
          )}
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            onLoad={handleImageLoad}
            className="max-w-full max-h-full object-contain border border-gray-400"
            style={{
              display: imageLoading ? "none" : "block",
              minWidth: "200px",
              minHeight: "150px",
            }}
          />
        </div>
      </div>

      {/* Image Information */}
      <div className="p-2 border-t border-gray-400 bg-gray-100">
        <h4 className="font-bold font-['Pixelated MS Sans Serif'] mb-1">
          {currentImage.title || `Image ${currentIndex + 1}`}
        </h4>
        {currentImage.title && (
          <p className="text-xs text-gray-600 font-['Pixelated MS Sans Serif']">
            {currentImage.alt}
          </p>
        )}

        {/* Quick navigation hints */}
        <div className="mt-2 text-xs text-gray-500 font-['Pixelated MS Sans Serif']">
          Use ← → arrow keys to navigate
          {totalImages > 2 && " • Home/End for first/last"}
        </div>
      </div>
    </div>
  )
}
