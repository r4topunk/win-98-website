import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react"

export interface Window {
  id: string
  title: string
  content: ReactNode
  isOpen: boolean
  isMinimized: boolean
  position: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  noScroll?: boolean // New prop for disabling scroll
}

interface WindowContextType {
  windows: Window[]
  activeWindowId: string | null
  openWindow: (
    window: Omit<Window, "isOpen" | "isMinimized" | "position" | "zIndex">
  ) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  focusWindow: (id: string) => void
  setWindowPosition: (id: string, position: { x: number; y: number }) => void
  setWindowSize: (id: string, size: { width: number; height: number }) => void
}

const WindowContext = createContext<WindowContextType | undefined>(undefined)

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<Window[]>([])
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [screenDimensions, setScreenDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  // Update screen dimensions and mobile status on resize with debouncing
  useEffect(() => {
    let timeoutId: number
    
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        setScreenDimensions({ width, height })
        setIsMobile(width < 768) // Common breakpoint for mobile
      }, 100) // 100ms debounce
    }

    // Set initial values
    const width = window.innerWidth
    const height = window.innerHeight
    setScreenDimensions({ width, height })
    setIsMobile(width < 768)

    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const getDefaultWindowPosition = useCallback(() => {
    // Default window size to calculate centering
    const defaultWidth = isMobile
      ? Math.min(320, screenDimensions.width - 20)
      : 950 // Much wider default for desktop
    const defaultHeight = isMobile
      ? screenDimensions.height > 500
        ? 400
        : screenDimensions.height - 140 // Account for navbar
      : 600 // Taller default height

    // Calculate center position, accounting for navbar (approximately 40px)
    const navbarHeight = 40
    const availableHeight = screenDimensions.height - navbarHeight
    const centerX = screenDimensions.width / 2 - defaultWidth / 2
    const centerY = availableHeight / 2 - defaultHeight / 2

    // Apply zoom correction if needed
    const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1

    // On mobile, always center windows without cascade effect
    if (isMobile) {
      return {
        x: Math.max(0, centerX / zoom),
        y: Math.max(0, centerY / zoom),
      }
    }

    // Add cascade effect for multiple windows (desktop only)
    const offset = windows.length * 30 // Increased offset for wider windows
    const maxOffset = Math.min(screenDimensions.width, availableHeight) * 0.15
    const limitedOffset = Math.min(offset, maxOffset)

    return {
      x: Math.max(0, centerX / zoom + limitedOffset / zoom),
      y: Math.max(0, centerY / zoom + limitedOffset / zoom),
    }
  }, [screenDimensions, windows.length, isMobile])

  const getDefaultWindowSize = useCallback(() => {
    if (isMobile) {
      // Constrain window size more tightly on mobile to prevent overlap with navbar
      return {
        width: Math.min(320, screenDimensions.width - 20),
        height: Math.min(400, screenDimensions.height - 140), // Account for navbar
      }
    }

    // Desktop default window size
    return {
      width: 740,
      height: 540,
    }
  }, [isMobile, screenDimensions])

  const openWindow = useCallback((
    window: Omit<Window, "isOpen" | "isMinimized" | "position" | "zIndex">
  ) => {
    setWindows((prev) => {
      // Check if window already exists
      const existingWindowIndex = prev.findIndex((w) => w.id === window.id)

      if (existingWindowIndex !== -1) {
        // If window exists, just make it visible and bring to front
        const updatedWindows = [...prev]

        // Move the window to the end of the array (top z-index)
        const existingWindow = updatedWindows.splice(existingWindowIndex, 1)[0]
        const focusedWindow = {
          ...existingWindow,
          isOpen: true,
          isMinimized: false,
          zIndex: Math.max(...prev.map((w) => w.zIndex || 0)) + 1,
        }

        updatedWindows.push(focusedWindow)
        setActiveWindowId(focusedWindow.id)

        return updatedWindows
      }

      const defaultPosition = getDefaultWindowPosition()
      const defaultSize = getDefaultWindowSize()
      const newZIndex = Math.max(...prev.map((w) => w.zIndex || 0)) + 1

      // Otherwise add new window with default position
      const newWindow = {
        ...window,
        isOpen: true,
        isMinimized: false,
        position: defaultPosition,
        size: window.size || defaultSize,
        zIndex: newZIndex,
      }

      setActiveWindowId(newWindow.id)

      return [...prev, newWindow]
    })
  }, [getDefaultWindowPosition, getDefaultWindowSize])

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((window) => window.id !== id))
    if (activeWindowId === id) {
      setActiveWindowId(null)
    }
  }, [activeWindowId])

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id ? { ...window, isMinimized: true } : window
      )
    )
    if (activeWindowId === id) {
      setActiveWindowId(null)
    }
  }, [activeWindowId])

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? { ...window, isMinimized: false, isOpen: true }
          : window
      )
    )
    setActiveWindowId(id)
  }, [])

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? {
              ...window,
              zIndex: Math.max(...prev.map((w) => w.zIndex || 0)) + 1,
            }
          : window
      )
    )
    setActiveWindowId(id)
  }, [])

  const setWindowPosition = useCallback((
    id: string,
    position: { x: number; y: number }
  ) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id ? { ...window, position } : window
      )
    )
  }, [])

  const setWindowSize = useCallback((
    id: string,
    size: { width: number; height: number }
  ) => {
    setWindows((prev) =>
      prev.map((window) => (window.id === id ? { ...window, size } : window))
    )
  }, [])

  return (
    <WindowContext.Provider
      value={{
        windows,
        activeWindowId,
        openWindow,
        closeWindow,
        minimizeWindow,
        restoreWindow,
        focusWindow,
        setWindowPosition,
        setWindowSize,
      }}
    >
      {children}
    </WindowContext.Provider>
  )
}

export function useWindowContext() {
  const context = useContext(WindowContext)
  if (context === undefined) {
    throw new Error("useWindowContext must be used within a WindowProvider")
  }
  return context
}
