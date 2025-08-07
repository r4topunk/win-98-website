import { memo } from "react"
import { useAppSelector } from "../store/hooks"
import { selectVisibleWindows } from "../store/selectors"
import { OptimizedWindow } from "./OptimizedWindow"
import { useWindowContext } from "../contexts/EnhancedWindowContext"

// Memoized WindowManager to prevent unnecessary re-renders
export const OptimizedWindowManager = memo(() => {
  const visibleWindows = useAppSelector(selectVisibleWindows)
  const { closeWindow } = useWindowContext()

  return (
    <>
      {visibleWindows.map((window) => (
        <OptimizedWindow
          key={window.id}
          windowId={window.id}
          onClose={() => closeWindow(window.id)}
        />
      ))}
    </>
  )
})

OptimizedWindowManager.displayName = "OptimizedWindowManager"
