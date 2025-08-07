import { useState, useEffect } from "react"
import { ImageGallery } from "../../data/galleries"
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
  const { windows } = useWindowContext()
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex)
  const [imageLoading, setImageLoading] = useState(true)

  // Find the current window to check if it's fullscreen
  const currentWindow = windowId ? windows.find(w => w.id === windowId) : null
  const isFullscreen = currentWindow?.isFullscreen || false

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
        isFullscreen ? "items-center w-full h-full" : "",
        className
      )}
    >
      {/* Main Image Display */}
      <div className={cn(
        "relative",
        isFullscreen ? "flex justify-center items-center w-full h-full" : "w-full h-full flex justify-center items-center"
      )}>
        {imageLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center bg-gray-200 border border-gray-400",
            !isFullscreen && "min-w-[200px] min-h-[150px]"
          )}>
            <p className="text-sm font-['Pixelated MS Sans Serif']">
              Loading...
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
            className="absolute bottom-2 left-2 right-2 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 font-['Pixelated MS Sans Serif'] border border-green-700 transition-colors duration-200"
            onClick={() => window.open(currentImage.link, '_blank')}
          >
            View on Spotify
          </button>
        )}
      </div>
    </div>
  )
}
