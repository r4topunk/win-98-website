import { useEffect, useRef, useState, useCallback } from "react"

interface CRTEffectProps {
  children: React.ReactNode
}

export const CRTEffect: React.FC<CRTEffectProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scanlineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Optimized drag handlers with useCallback
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseDown = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (target.closest(".window") && target.closest(".title-bar")) {
      setIsDragging(true)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
    }
  }, [isDragging])

  // Intersection Observer for visibility optimization
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  // Event listeners with optimized handlers
  useEffect(() => {
    document.addEventListener("dragstart", handleDragStart, { passive: true })
    document.addEventListener("dragend", handleDragEnd, { passive: true })
    document.addEventListener("mousedown", handleMouseDown, { passive: true })
    document.addEventListener("mouseup", handleMouseUp, { passive: true })

    return () => {
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("dragend", handleDragEnd)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleDragStart, handleDragEnd, handleMouseDown, handleMouseUp])

  return (
    <div ref={containerRef} className="relative">
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100]">
        {/* Optimized scanlines with CSS containment and reduced animation during interactions */}
        <div
          ref={scanlineRef}
          className={`crt-scanline absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-transparent bg-[length:100%_6px] ${
            isDragging || !isVisible ? "paused" : "animate-scan"
          }`}
          style={{
            willChange: isDragging || !isVisible ? "auto" : "transform",
            transform: isDragging ? "translateZ(0)" : "none",
          }}
        ></div>

        {/* Vignette effect - static, no animations */}
        <div 
          className="absolute inset-0 bg-radial-gradient opacity-30"
          style={{ willChange: "auto" }}
        ></div>

        {/* Screen curvature - static effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/5"
          style={{ willChange: "auto" }}
        ></div>
      </div>
    </div>
  )
}
