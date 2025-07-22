import React, {
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  CSSProperties,
} from "react"
import { useWindowContext } from "../contexts/WindowContext"
import { cn } from "../utils/cn"

interface WindowProps {
  id: string
  title: string
  children: ReactNode
  isOpen: boolean
  position: { x: number; y: number }
  size?: { width: number; height: number }
  onClose: () => void
  onFocus?: () => void
  isActive?: boolean
  style?: CSSProperties
}

export function Window({
  id,
  title,
  children,
  isOpen,
  position,
  size,
  onClose,
  onFocus,
  isActive = true,
  style = {},
}: WindowProps) {
  const { setWindowPosition, setWindowSize, minimizeWindow } =
    useWindowContext()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>("")
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  })
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  // Get zoom level from document body (will be 1 if no zoom is applied)
  const getZoomLevel = () => {
    // Get the current zoom level - fallback to 1 if not set
    const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1
    return zoom
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the title bar
    if ((e.target as HTMLElement).closest(".title-bar")) {
      e.preventDefault() // Prevent default drag behavior
      // Focus window immediately when starting to drag
      onFocus?.()
      setIsDragging(true)

      // Add dragging class to body to prevent text selection
      document.body.classList.add("dragging")

      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        const zoom = getZoomLevel()
        // Adjust for zoom by dividing coordinates by zoom factor
        setDragOffset({
          x: e.clientX / zoom - rect.left / zoom,
          y: e.clientY / zoom - rect.top / zoom,
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection("")

    // Remove dragging class from body
    document.body.classList.remove("dragging")
  }

  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: string
  ) => {
    e.stopPropagation() // Prevent window drag
    e.preventDefault() // Prevent default drag behavior
    setIsResizing(true)
    setResizeDirection(direction)

    // Add dragging class to body to prevent text selection
    document.body.classList.add("dragging")

    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      const zoom = getZoomLevel()

      setResizeStartSize({
        width: rect.width / zoom,
        height: rect.height / zoom,
      })
      setResizeStartPos({
        x: e.clientX / zoom,
        y: e.clientY / zoom,
      })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault() // Prevent default behavior during drag
      const zoom = getZoomLevel()

      if (isDragging && windowRef.current) {
        // Apply zoom correction
        const newX = e.clientX / zoom - dragOffset.x
        const newY = e.clientY / zoom - dragOffset.y

        // Get container bounds to constrain window position
        const container = document.querySelector(
          ".bg-\\[url\\(\\'\\/bg\\.jpg\\'\\)\\]"
        )
        const containerRect = container?.getBoundingClientRect()

        // Constrain position within visible area
        let constrainedX = newX
        let constrainedY = newY

        if (containerRect) {
          const windowWidth = windowRef.current.offsetWidth

          // Don't let window go completely off-screen
          constrainedX = Math.max(
            -(windowWidth * 0.75),
            Math.min(
              constrainedX,
              containerRect.width / zoom - windowWidth * 0.25
            )
          )
          constrainedY = Math.max(
            0,
            Math.min(constrainedY, containerRect.height / zoom - 50)
          ) // Keep title bar visible
        }

        setWindowPosition(id, { x: constrainedX, y: constrainedY })
      } else if (isResizing && windowRef.current) {
        const deltaX = e.clientX / zoom - resizeStartPos.x
        const deltaY = e.clientY / zoom - resizeStartPos.y

        let newWidth = resizeStartSize.width
        let newHeight = resizeStartSize.height

        // Calculate new dimensions based on resize direction
        if (resizeDirection.includes("right")) {
          newWidth = Math.max(250, resizeStartSize.width + deltaX) // Minimum width
        }
        if (resizeDirection.includes("left")) {
          newWidth = Math.max(250, resizeStartSize.width - deltaX)
        }
        if (resizeDirection.includes("bottom")) {
          newHeight = Math.max(200, resizeStartSize.height + deltaY) // Minimum height
        }
        if (resizeDirection.includes("top")) {
          newHeight = Math.max(200, resizeStartSize.height - deltaY)
        }

        // Update window size
        setWindowSize(id, { width: newWidth, height: newHeight })

        // If resizing from top or left, also update position
        if (
          resizeDirection.includes("left") ||
          resizeDirection.includes("top")
        ) {
          let newX = position.x
          let newY = position.y

          if (resizeDirection.includes("left")) {
            newX = position.x + (resizeStartSize.width - newWidth)
          }
          if (resizeDirection.includes("top")) {
            newY = position.y + (resizeStartSize.height - newHeight)
          }

          setWindowPosition(id, { x: newX, y: newY })
        }
      }
    },
    [
      isDragging,
      isResizing,
      dragOffset,
      resizeDirection,
      resizeStartSize,
      resizeStartPos,
      id,
      setWindowPosition,
      setWindowSize,
      position,
    ]
  )

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".title-bar")) {
      e.preventDefault() // Prevent default touch behavior
      // Focus window immediately when starting to drag
      onFocus?.()
      setIsDragging(true)

      // Add dragging class to body to prevent text selection
      document.body.classList.add("dragging")

      const rect = windowRef.current?.getBoundingClientRect()
      if (rect && e.touches[0]) {
        const zoom = getZoomLevel()
        const touch = e.touches[0]
        setDragOffset({
          x: touch.clientX / zoom - rect.left / zoom,
          y: touch.clientY / zoom - rect.top / zoom,
        })
      }
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && windowRef.current && e.touches[0]) {
      e.preventDefault() // Prevent scrolling while dragging
      const zoom = getZoomLevel()
      const touch = e.touches[0]
      const newX = touch.clientX / zoom - dragOffset.x
      const newY = touch.clientY / zoom - dragOffset.y

      // Apply constraints as in handleMouseMove
      const container = document.querySelector(
        ".bg-\\[url\\(\\'\\/bg\\.jpg\\'\\)\\]"
      )
      const containerRect = container?.getBoundingClientRect()

      let constrainedX = newX
      let constrainedY = newY

      if (containerRect) {
        const windowWidth = windowRef.current.offsetWidth

        constrainedX = Math.max(
          -(windowWidth * 0.75),
          Math.min(
            constrainedX,
            containerRect.width / zoom - windowWidth * 0.25
          )
        )
        constrainedY = Math.max(
          0,
          Math.min(constrainedY, containerRect.height / zoom - 50)
        )
      }

      setWindowPosition(id, { x: constrainedX, y: constrainedY })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    // Remove dragging class from body
    document.body.classList.remove("dragging")
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("touchend", handleTouchEnd)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      // Ensure dragging class is removed on cleanup
      document.body.classList.remove("dragging")
    }
  }, [isDragging, isResizing, handleMouseMove]) // Simplified dependencies

  if (!isOpen) return null

  return (
    <div
      ref={windowRef}
      className={cn("window absolute shadow-md", {
        "opacity-90": !isActive,
      })}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: size?.width ? `${size.width}px` : "300px",
        height: size?.height ? `${size.height}px` : "auto",
        maxWidth: "100%",
        maxHeight: "calc(100% - 30px)",
        zIndex: isDragging || isResizing ? 9999 : style.zIndex || 10,
        transform: isDragging || isResizing ? "translateZ(0)" : "none", // Force GPU acceleration during drag
        ...style,
      }}
      onMouseDown={(e) => {
        // Focus window on click (for non-title bar clicks)
        if (!(e.target as HTMLElement).closest(".title-bar")) {
          onFocus?.()
        }
        handleMouseDown(e)
      }}
      onTouchStart={handleTouchStart}
    >
      <div className="title-bar cursor-move">
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={() => minimizeWindow(id)} />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div
        className="window-body relative flex-1 min-h-0"
        style={{
          overflow: "hidden", // Prevent content from overflowing the window
          height: size?.height ? `${size.height - 60}px` : "calc(100% - 60px)", // Account for title bar
        }}
      >
        <div
          className="h-full overflow-auto p-2"
          style={{
            maxHeight: "100%", // Ensure content scrolls within bounds
          }}
        >
          {children}
        </div>

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
}
