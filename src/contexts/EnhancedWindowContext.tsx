import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import { Provider } from 'react-redux'
import { store } from '../store/store'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import {
  openWindow as openWindowAction,
  closeWindow as closeWindowAction,
  minimizeWindow as minimizeWindowAction,
  restoreWindow as restoreWindowAction,
  maximizeWindow as maximizeWindowAction,
  focusWindow as focusWindowAction,
  updateWindowPosition as updateWindowPositionAction,
  updateWindowSize as updateWindowSizeAction,
  updateScreenDimensions as updateScreenDimensionsAction,
} from '../store/windowSlice'
import {
  selectVisibleWindows,
  selectActiveWindowId,
} from '../store/selectors'

// Legacy Window interface for backward compatibility
export interface Window {
  id: string
  title: string
  content: ReactNode
  isOpen: boolean
  isMinimized: boolean
  isFullscreen: boolean
  position: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  noScroll?: boolean
  originalPosition?: { x: number; y: number }
  originalSize?: { width: number; height: number }
}

interface WindowContextType {
  windows: Window[]
  activeWindowId: string | null
  openWindow: (
    window: Omit<Window, "isOpen" | "isMinimized" | "isFullscreen" | "position" | "zIndex" | "originalPosition" | "originalSize">
  ) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  setWindowPosition: (id: string, position: { x: number; y: number }) => void
  setWindowSize: (id: string, size: { width: number; height: number }) => void
}

const WindowContext = createContext<WindowContextType | undefined>(undefined)

// Internal provider that uses Redux
function WindowContextProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  
  // Use memoized selectors to prevent unnecessary re-renders
  const visibleWindows = useAppSelector(selectVisibleWindows)
  const activeWindowId = useAppSelector(selectActiveWindowId)
  
  // Convert Redux entities to legacy Window format
  const windows = useMemo(() => 
    visibleWindows.map((window): Window => ({
      id: window.id,
      title: window.title,
      content: window.content,
      isOpen: window.isOpen,
      isMinimized: window.isMinimized,
      isFullscreen: window.isFullscreen,
      position: window.position,
      size: window.size,
      zIndex: window.zIndex,
      noScroll: window.noScroll,
      originalPosition: window.originalPosition,
      originalSize: window.originalSize,
    })),
    [visibleWindows]
  )

  // Memoized action creators
  const openWindow = useCallback((
    window: Omit<Window, "isOpen" | "isMinimized" | "isFullscreen" | "position" | "zIndex" | "originalPosition" | "originalSize">
  ) => {
    dispatch(openWindowAction({
      id: window.id,
      title: window.title,
      content: window.content,
      size: window.size,
      noScroll: window.noScroll,
    }))
  }, [dispatch])

  const closeWindow = useCallback((id: string) => {
    dispatch(closeWindowAction(id))
  }, [dispatch])

  const minimizeWindow = useCallback((id: string) => {
    dispatch(minimizeWindowAction(id))
  }, [dispatch])

  const restoreWindow = useCallback((id: string) => {
    dispatch(restoreWindowAction(id))
  }, [dispatch])

  const maximizeWindow = useCallback((id: string) => {
    dispatch(maximizeWindowAction(id))
  }, [dispatch])

  const focusWindow = useCallback((id: string) => {
    dispatch(focusWindowAction(id))
  }, [dispatch])

  const setWindowPosition = useCallback((
    id: string,
    position: { x: number; y: number }
  ) => {
    dispatch(updateWindowPositionAction({ id, position }))
  }, [dispatch])

  const setWindowSize = useCallback((
    id: string,
    size: { width: number; height: number }
  ) => {
    dispatch(updateWindowSizeAction({ id, size }))
  }, [dispatch])

  // Screen dimension tracking with debouncing
  useEffect(() => {
    let timeoutId: number
    
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        dispatch(updateScreenDimensionsAction({
          width: window.innerWidth,
          height: window.innerHeight
        }))
      }, 100) // 100ms debounce
    }

    // Set initial values
    dispatch(updateScreenDimensionsAction({
      width: window.innerWidth,
      height: window.innerHeight
    }))

    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [dispatch])

  const contextValue = useMemo(() => ({
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    focusWindow,
    setWindowPosition,
    setWindowSize,
  }), [
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    focusWindow,
    setWindowPosition,
    setWindowSize,
  ])

  return (
    <WindowContext.Provider value={contextValue}>
      {children}
    </WindowContext.Provider>
  )
}

// Public provider that wraps Redux Provider and WindowContext
export function WindowProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <WindowContextProvider>
        {children}
      </WindowContextProvider>
    </Provider>
  )
}

export function useWindowContext() {
  const context = useContext(WindowContext)
  if (context === undefined) {
    throw new Error("useWindowContext must be used within a WindowProvider")
  }
  return context
}

// New optimized hooks for direct Redux access
export { useAppSelector, useAppDispatch } from '../store/hooks'
export * from '../store/selectors'
export * from '../store/windowSlice'
