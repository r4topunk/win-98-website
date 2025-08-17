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
  const { windows, openWindow } = useWindowContext()
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex)
  const [imageLoading, setImageLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
      } else if (viewportWidth < 1400) {
        // Medium screens: smaller size for 1352x878 etc
        videoWidth = 480
        videoHeight = 270 // 16:9 aspect ratio
      } else {
        // Large screens: smaller video size than before
        videoWidth = 600
        videoHeight = 337 // 16:9 aspect ratio
      }
      
      openWindow({
        id: `youtube-${youtubeId}-${Date.now()}`,
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

        {/* YouTube button for images with YouTube links */}
        {currentImage.link && (currentImage.link.includes('youtube.com') || currentImage.link.includes('youtu.be')) && !imageLoading && (
          <button
            className="absolute bottom-2 left-2 right-2 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 font-['Pixelated MS Sans Serif'] border border-red-800 transition-colors duration-200"
            onClick={handleYouTubeClick}
          >
Watch video
          </button>
        )}
      </div>
    </div>
  )
}
