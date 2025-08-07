import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from "react"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import {
  updateWindowPosition,
  updateWindowSize,
  minimizeWindow,
  maximizeWindow,
  focusWindow,
  startDrag,
  endDrag,
  startResize,
  endResize,
} from "../store/windowSlice"
import { 
  selectWindowById,
  selectIsWindowDragging,
  selectIsWindowResizing,
  selectResizeState
} from "../store/selectors"
import { cn } from "../utils/cn"

interface OptimizedWindowProps {
  windowId: string
  onClose: () => void
}

// Memoized Window component to prevent unnecessary re-renders
const OptimizedWindow = memo(({ windowId, onClose }: OptimizedWindowProps) => {
  const dispatch = useAppDispatch()
  
  // Optimized selectors - only subscribe to specific window data
  const window = useAppSelector((state) => selectWindowById(windowId)(state))
  const isDragging = useAppSelector((state) => selectIsWindowDragging(windowId)(state))
  const isResizing = useAppSelector((state) => selectIsWindowResizing(windowId)(state))
  const resizeState = useAppSelector(selectResizeState)
  
  const windowRef = useRef<HTMLDivElement>(null)

  // Local state for interaction tracking (doesn't need to be in Redux)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })

  if (!window) return null

  // Get zoom level from document body
  const getZoomLevel = useCallback(() => {
    return parseFloat(getComputedStyle(document.body).zoom) || 1
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".title-bar")) {
      e.preventDefault()
      
      document.body.classList.add("dragging")

      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        const zoom = getZoomLevel()
        const offset = {
          x: e.clientX / zoom - rect.left / zoom,
          y: e.clientY / zoom - rect.top / zoom,
        }
        setDragOffset(offset)
        dispatch(startDrag({ windowId, offset }))
      }
    }
  }, [windowId, dispatch, getZoomLevel])

  const handleMouseUp = useCallback(() => {
    dispatch(endDrag())
    dispatch(endResize())
    document.body.classList.remove("dragging")
  }, [dispatch])

  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    direction: string
  ) => {
    e.stopPropagation()
    e.preventDefault()
    
    document.body.classList.add("dragging")

    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      const zoom = getZoomLevel()

      const startSize = {
        width: rect.width / zoom,
        height: rect.height / zoom,
      }
      const startPos = {
        x: e.clientX / zoom,
        y: e.clientY / zoom,
      }
      
      setResizeStartSize(startSize)
      setResizeStartPos(startPos)
      
      dispatch(startResize({
        windowId,
        direction,
        startSize,
        startPos,
      }))
    }
  }, [windowId, dispatch, getZoomLevel])

  // Optimized mouse move handler using RAF for smooth updates
  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault()
    const zoom = getZoomLevel()

    if (isDragging && windowRef.current) {
      // Use RAF for smooth position updates
      requestAnimationFrame(() => {
        const newX = e.clientX / zoom - dragOffset.x
        const newY = e.clientY / zoom - dragOffset.y

        // Constrain position within viewport
        const container = document.querySelector(".bg-\\[url\\(\\'\\/bg\\.jpg\\'\\)\\]")
        const containerRect = container?.getBoundingClientRect()

        let constrainedX = newX
        let constrainedY = newY

        if (containerRect && windowRef.current) {
          const windowWidth = windowRef.current.offsetWidth

          constrainedX = Math.max(
            -(windowWidth * 0.75),
            Math.min(constrainedX, containerRect.width / zoom - windowWidth * 0.25)
          )
          constrainedY = Math.max(0, Math.min(constrainedY, containerRect.height / zoom - 50))
        }

        dispatch(updateWindowPosition({ 
          id: windowId, 
          position: { x: constrainedX, y: constrainedY } 
        }))
      })
    } else if (isResizing && windowRef.current) {
      requestAnimationFrame(() => {
        const deltaX = e.clientX / zoom - resizeStartPos.x
        const deltaY = e.clientY / zoom - resizeStartPos.y

        let newWidth = resizeStartSize.width
        let newHeight = resizeStartSize.height

        // Calculate new dimensions based on resize direction
        if (resizeState.direction.includes("right")) {
          newWidth = Math.max(250, resizeStartSize.width + deltaX)
        }
        if (resizeState.direction.includes("left")) {
          newWidth = Math.max(250, resizeStartSize.width - deltaX)
        }
        if (resizeState.direction.includes("bottom")) {
          newHeight = Math.max(200, resizeStartSize.height + deltaY)
        }
        if (resizeState.direction.includes("top")) {
          newHeight = Math.max(200, resizeStartSize.height - deltaY)
        }

        dispatch(updateWindowSize({ id: windowId, size: { width: newWidth, height: newHeight } }))

        // Update position if resizing from top or left
        if (resizeState.direction.includes("left") || resizeState.direction.includes("top")) {
          let newX = window.position.x
          let newY = window.position.y

          if (resizeState.direction.includes("left")) {
            newX = window.position.x + (resizeStartSize.width - newWidth)
          }
          if (resizeState.direction.includes("top")) {
            newY = window.position.y + (resizeStartSize.height - newHeight)
          }

          dispatch(updateWindowPosition({ id: windowId, position: { x: newX, y: newY } }))
        }
      })
    }
  }, [
    isDragging,
    isResizing,
    dragOffset,
    windowId,
    dispatch,
    getZoomLevel,
    resizeStartSize,
    resizeStartPos,
    resizeState.direction,
    window.position,
  ])

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".title-bar")) {
      e.preventDefault()
      document.body.classList.add("dragging")

      const rect = windowRef.current?.getBoundingClientRect()
      if (rect && e.touches[0]) {
        const zoom = getZoomLevel()
        const touch = e.touches[0]
        const offset = {
          x: touch.clientX / zoom - rect.left / zoom,
          y: touch.clientY / zoom - rect.top / zoom,
        }
        setDragOffset(offset)
        dispatch(startDrag({ windowId, offset }))
      }
    }
  }, [windowId, dispatch, getZoomLevel])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && windowRef.current && e.touches[0]) {
      e.preventDefault()
      const zoom = getZoomLevel()
      const touch = e.touches[0]
      
      requestAnimationFrame(() => {
        const newX = touch.clientX / zoom - dragOffset.x
        const newY = touch.clientY / zoom - dragOffset.y

        const container = document.querySelector(".bg-\\[url\\(\\'\\/bg\\.jpg\\'\\)\\]")
        const containerRect = container?.getBoundingClientRect()

        let constrainedX = newX
        let constrainedY = newY

        if (containerRect && windowRef.current) {
          const windowWidth = windowRef.current.offsetWidth
          constrainedX = Math.max(
            -(windowWidth * 0.75),
            Math.min(constrainedX, containerRect.width / zoom - windowWidth * 0.25)
          )
          constrainedY = Math.max(0, Math.min(constrainedY, containerRect.height / zoom - 50))
        }

        dispatch(updateWindowPosition({ 
          id: windowId, 
          position: { x: constrainedX, y: constrainedY } 
        }))
      })
    }
  }, [isDragging, dragOffset, windowId, dispatch, getZoomLevel])

  const handleTouchEnd = useCallback(() => {
    dispatch(endDrag())
    document.body.classList.remove("dragging")
  }, [dispatch])

  // Optimized event listeners management
  useEffect(() => {
    if (isDragging || isResizing) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
      const handleGlobalMouseUp = () => handleMouseUp()
      const handleGlobalTouchMove = (e: TouchEvent) => handleTouchMove(e)
      const handleGlobalTouchEnd = () => handleTouchEnd()

      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
      document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false })
      document.addEventListener("touchend", handleGlobalTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
        document.removeEventListener("touchmove", handleGlobalTouchMove)
        document.removeEventListener("touchend", handleGlobalTouchEnd)
        document.body.classList.remove("dragging")
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  const handleFocus = useCallback(() => {
    dispatch(focusWindow(windowId))
  }, [windowId, dispatch])

  const handleMinimize = useCallback(() => {
    dispatch(minimizeWindow(windowId))
  }, [windowId, dispatch])

  const handleMaximize = useCallback(() => {
    dispatch(maximizeWindow(windowId))
  }, [windowId, dispatch])

  if (!window.isOpen) return null

  return (
    <div
      ref={windowRef}
      className="window absolute shadow-md"
      style={{
        left: `${window.position.x}px`,
        top: `${window.position.y}px`,
        width: window.size?.width ? `${window.size.width}px` : window.noScroll ? "auto" : "300px",
        height: window.isFullscreen && window.size?.height
          ? `${window.size.height}px`
          : !window.noScroll && window.size?.height
            ? `${window.size.height}px`
            : window.noScroll
            ? "auto"
            : "auto",
        maxWidth: "100%",
        maxHeight: window.isFullscreen ? "100%" : "calc(100% - 30px)",
        zIndex: isDragging || isResizing ? 9999 : window.zIndex || 10,
        transform: isDragging || isResizing ? "translateZ(0)" : "none", // GPU acceleration
      }}
      onMouseDown={(e) => {
        handleFocus()
        handleMouseDown(e)
      }}
      onTouchStart={(e) => {
        handleFocus()
        handleTouchStart(e)
      }}
    >
      <div className="title-bar cursor-move">
        <div className="title-bar-text">{window.title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={handleMinimize} />
          <button aria-label="Maximize" onClick={handleMaximize} />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      
      <div
        className={cn("relative", {
          "flex-1 min-h-0": !window.noScroll || window.isFullscreen,
          "h-full": window.isFullscreen && window.noScroll,
        })}
        style={
          window.noScroll
            ? { 
                overflow: window.isFullscreen ? "hidden" : "visible", 
                padding: 0,
                height: window.isFullscreen 
                  ? "calc(100% - 30px)"
                  : "auto"
              }
            : {
                overflow: "hidden",
                height: window.size?.height
                  ? `${window.size.height - 30}px`
                  : "calc(100%)",
              }
        }
      >
        {window.noScroll ? (
          window.content
        ) : (
          <div
            className="h-full overflow-auto"
            style={{
              maxHeight: "100%",
            }}
          >
            {window.content}
          </div>
        )}

        {/* Resize handles */}
        <div
          className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "top-right")}
        />
        <div
          className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "top-left")}
        />
        <div
          className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom-right")}
        />
        <div
          className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom-left")}
        />
        <div
          className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "top")}
        />
        <div
          className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
        />
        <div
          className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "left")}
        />
        <div
          className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, "right")}
        />
      </div>
    </div>
  )
})

OptimizedWindow.displayName = "OptimizedWindow"

export { OptimizedWindow }
