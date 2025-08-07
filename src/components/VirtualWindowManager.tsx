import { memo, useMemo } from "react"
import { useAppSelector } from "../store/hooks"
import { selectVisibleWindows } from "../store/selectors"
import { OptimizedWindow } from "./OptimizedWindow"
import { useWindowContext } from "../contexts/EnhancedWindowContext"

// Virtual window manager that only renders windows in viewport
export const VirtualWindowManager = memo(() => {
  const visibleWindows = useAppSelector(selectVisibleWindows)
  const { closeWindow } = useWindowContext()

  // Only render windows that are actually visible on screen
  const renderableWindows = useMemo(() => {
    if (typeof window === 'undefined') return visibleWindows

    const viewport = {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    }

    return visibleWindows.filter((windowEntity) => {
      const windowBounds = {
        left: windowEntity.position.x,
        top: windowEntity.position.y,
        right: windowEntity.position.x + (windowEntity.size?.width || 300),
        bottom: windowEntity.position.y + (windowEntity.size?.height || 200)
      }

      // Check if window is at least partially visible
      return !(
        windowBounds.right < viewport.left ||
        windowBounds.left > viewport.right ||
        windowBounds.bottom < viewport.top ||
        windowBounds.top > viewport.bottom
      )
    })
  }, [visibleWindows])

  return (
    <>
      {renderableWindows.map((window) => (
        <OptimizedWindow
          key={window.id}
          windowId={window.id}
          onClose={() => closeWindow(window.id)}
        />
      ))}
    </>
  )
})

VirtualWindowManager.displayName = "VirtualWindowManager"
