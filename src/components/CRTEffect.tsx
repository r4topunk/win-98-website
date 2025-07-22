import { useEffect, useRef, useState } from "react"

interface CRTEffectProps {
  children: React.ReactNode
}

export const CRTEffect: React.FC<CRTEffectProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Remove flickering: set brightness to normal
    container.style.filter = "brightness(1)"

    const handleDragStart = () => {
      setIsDragging(true)
      container.style.filter = "brightness(1)" // Set to normal during drag
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    // Listen for drag events to pause effects
    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("dragend", handleDragEnd)

    // Also listen for mouse events on windows being dragged
    const handleMouseDown = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest(".window") && target.closest(".title-bar")) {
        setIsDragging(true)
        container.style.filter = "brightness(1)"
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setTimeout(() => {
          if (container.style.filter === "brightness(1)") {
            // Resume normal (no flicker) after drag ends
          }
        }, 100)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("dragend", handleDragEnd)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100]">
        {/* Scanlines - reduce animation complexity during drag */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent bg-[length:100%_6px] ${
            isDragging ? "" : "animate-scan"
          }`}
        ></div>

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-radial-gradient opacity-30"></div>

        {/* Screen curvature */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/5"></div>
      </div>
    </div>
  )
}
