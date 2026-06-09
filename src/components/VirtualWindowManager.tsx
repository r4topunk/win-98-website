import { memo } from "react"
import { useAppSelector } from "../store/hooks"
import { selectRenderableWindows } from "../store/selectors"
import { OptimizedWindow } from "./OptimizedWindow"

// Renders every open window (including minimized ones, kept alive via
// display:none so video playback / scroll position survive a restore).
//
// Previously this component also tried to viewport-cull off-screen windows,
// but that interacted badly with the drag-stranding bug (a window dragged
// 75% off-screen could be unmounted on browser resize, losing scroll/state
// with no taskbar recovery). The new clamping in OptimizedWindow + a
// re-clamp pass in windowSlice.updateScreenDimensions keep every window
// reachable, so culling is unnecessary at this scale.
export const VirtualWindowManager = memo(() => {
  const renderableWindows = useAppSelector(selectRenderableWindows)

  return (
    <>
      {renderableWindows.map((window) => (
        <OptimizedWindow key={window.id} windowId={window.id} />
      ))}
    </>
  )
})

VirtualWindowManager.displayName = "VirtualWindowManager"
