import { memo, Suspense, useState, useEffect } from "react"
import { WindowEntity } from '../store/windowSlice'

interface LazyWindowContentProps {
  window: WindowEntity
  isVisible: boolean
  isMinimized: boolean
}

// Lazy loading wrapper for window content
const LazyWindowContent = memo(({ window, isVisible, isMinimized }: LazyWindowContentProps) => {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Only load content when window becomes visible and not minimized
    if (isVisible && !isMinimized && !hasLoaded) {
      setHasLoaded(true)
      setShouldRender(true)
    }
    
    // Keep content loaded but can control rendering
    if (hasLoaded) {
      setShouldRender(isVisible && !isMinimized)
    }
  }, [isVisible, isMinimized, hasLoaded])

  if (!hasLoaded) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-100">
        <div className="text-sm font-['Pixelated MS Sans Serif']">
          Loading content...
        </div>
      </div>
    )
  }

  if (!shouldRender) {
    return null
  }

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-32 bg-gray-100">
          <div className="text-sm font-['Pixelated MS Sans Serif']">
            Loading...
          </div>
        </div>
      }
    >
      {window.content}
    </Suspense>
  )
})

LazyWindowContent.displayName = 'LazyWindowContent'

export { LazyWindowContent }
