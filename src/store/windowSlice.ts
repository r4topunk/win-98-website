import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ReactNode } from 'react'

// Enhanced window interface with normalized structure
export interface WindowEntity {
  id: string
  title: string
  content: ReactNode
  isOpen: boolean
  isMinimized: boolean
  isFullscreen: boolean
  position: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex: number
  noScroll?: boolean
  originalPosition?: { x: number; y: number }
  originalSize?: { width: number; height: number }
  lastFocused: number // timestamp for focus ordering
}

interface DragState {
  isDragging: boolean
  windowId: string | null
  offset: { x: number; y: number }
}

interface ResizeState {
  isResizing: boolean
  windowId: string | null
  direction: string
  startSize: { width: number; height: number }
  startPos: { x: number; y: number }
}

interface WindowState {
  // Normalized state structure for O(1) lookups
  entities: Record<string, WindowEntity>
  ids: string[]
  activeWindowId: string | null
  
  // Separate interaction states to prevent unnecessary re-renders
  dragState: DragState
  resizeState: ResizeState
  
  // UI state
  screenDimensions: { width: number; height: number }
  isMobile: boolean
  isSmallDesktop: boolean
  isMediumDesktop: boolean
  
  // Performance tracking
  maxZIndex: number
}

const initialState: WindowState = {
  entities: {},
  ids: [],
  activeWindowId: null,
  dragState: {
    isDragging: false,
    windowId: null,
    offset: { x: 0, y: 0 }
  },
  resizeState: {
    isResizing: false,
    windowId: null,
    direction: '',
    startSize: { width: 0, height: 0 },
    startPos: { x: 0, y: 0 }
  },
  screenDimensions: {
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  },
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  isSmallDesktop: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1150 : false,
  isMediumDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1150 && window.innerWidth < 1400 : false,
  maxZIndex: 10
}

// Helper function for calculating default window position
const getDefaultWindowPosition = (
  screenDimensions: { width: number; height: number },
  windowCount: number,
  isMobile: boolean,
  isSmallDesktop: boolean,
  isMediumDesktop: boolean
) => {
  const defaultWidth = isMobile 
    ? Math.min(320, screenDimensions.width - 20)
    : isSmallDesktop
    ? 320
    : isMediumDesktop
    ? 600
    : 740
  const defaultHeight = isMobile
    ? screenDimensions.height > 500 ? 400 : screenDimensions.height - 140
    : isSmallDesktop
    ? 260
    : isMediumDesktop
    ? 480
    : 540

  const navbarHeight = 40
  const availableHeight = screenDimensions.height - navbarHeight
  const centerX = screenDimensions.width / 2 - defaultWidth / 2
  const centerY = availableHeight / 2 - defaultHeight / 2

  const zoom = typeof window !== 'undefined' 
    ? parseFloat(getComputedStyle(document.body).zoom) || 1 
    : 1

  if (isMobile) {
    return {
      x: Math.max(0, centerX / zoom),
      y: Math.max(0, centerY / zoom)
    }
  }

  // Desktop cascade effect
  const offset = windowCount * 30
  const maxOffset = Math.min(screenDimensions.width, availableHeight) * 0.15
  const limitedOffset = Math.min(offset, maxOffset)

  return {
    x: Math.max(0, centerX / zoom + limitedOffset / zoom),
    y: Math.max(0, centerY / zoom + limitedOffset / zoom)
  }
}

const getDefaultWindowSize = (
  screenDimensions: { width: number; height: number },
  isMobile: boolean,
  isSmallDesktop: boolean,
  isMediumDesktop: boolean
) => {
  if (isMobile) {
    return {
      width: Math.min(320, screenDimensions.width - 20),
      height: Math.min(400, screenDimensions.height - 140)
    }
  }
  
  if (isSmallDesktop) {
    return {
      width: 320,
      height: 260
    }
  }
  
  if (isMediumDesktop) {
    return {
      width: 600,
      height: 480
    }
  }
  
  return {
    width: 740,
    height: 540
  }
}

const windowSlice = createSlice({
  name: 'windows',
  initialState,
  reducers: {
    openWindow: (state, action: PayloadAction<{
      id: string
      title: string
      content: ReactNode
      size?: { width: number; height: number }
      noScroll?: boolean
    }>) => {
      const { id, title, content, size, noScroll } = action.payload
      
      // Check if window already exists
      if (state.entities[id]) {
        const existingWindow = state.entities[id]
        existingWindow.isOpen = true
        existingWindow.isMinimized = false
        existingWindow.zIndex = ++state.maxZIndex
        existingWindow.lastFocused = Date.now()
        state.activeWindowId = id
        return
      }

      // Create new window
      const defaultPosition = getDefaultWindowPosition(
        state.screenDimensions,
        state.ids.length,
        state.isMobile,
        state.isSmallDesktop,
        state.isMediumDesktop
      )
      const defaultSize = getDefaultWindowSize(
        state.screenDimensions,
        state.isMobile,
        state.isSmallDesktop,
        state.isMediumDesktop
      )

      // Clamp size to viewport — the per-category sizes (e.g. 740×540 for
      // large desktops) assumed a body zoom 1.0 viewport, but the
      // `body { zoom: 1.25 }` rule scales every CSS pixel up 25%, so a
      // nominally-fitting window now overflows. Cap to (viewport / zoom)
      // minus a small margin so the window stays inside the visible desk.
      const NAVBAR_HEIGHT = 32
      const requestedSize = size || defaultSize
      const zoom = typeof window !== "undefined"
        ? parseFloat(getComputedStyle(document.body).zoom) || 1
        : 1
      const usableW = state.screenDimensions.width / zoom
      const usableH = state.screenDimensions.height / zoom
      const finalSize = {
        width: Math.min(requestedSize.width, Math.floor(usableW - 16)),
        height: Math.min(
          requestedSize.height,
          Math.floor(usableH - NAVBAR_HEIGHT - 16),
        ),
      }

      // Clamp position so the whole window fits on-screen at open time.
      // (Mid-drag clamping in OptimizedWindow allows windows to be parked
      // partially off-screen — that's the legacy Win98 feel — but the
      // INITIAL position should always fit comfortably.)
      const clampedPosition = {
        x: Math.max(
          0,
          Math.min(defaultPosition.x, Math.floor(usableW - finalSize.width - 8)),
        ),
        y: Math.max(
          0,
          Math.min(
            defaultPosition.y,
            Math.floor(usableH - finalSize.height - NAVBAR_HEIGHT),
          ),
        ),
      }

      const newWindow: WindowEntity = {
        id,
        title,
        content,
        isOpen: true,
        isMinimized: false,
        isFullscreen: false,
        position: clampedPosition,
        size: finalSize,
        zIndex: ++state.maxZIndex,
        noScroll,
        lastFocused: Date.now()
      }

      state.entities[id] = newWindow
      state.ids.push(id)
      state.activeWindowId = id
    },

    closeWindow: (state, action: PayloadAction<string>) => {
      const id = action.payload
      delete state.entities[id]
      state.ids = state.ids.filter(windowId => windowId !== id)
      
      if (state.activeWindowId === id) {
        // Focus the most recently used window
        const remainingWindows = state.ids
          .map(id => state.entities[id])
          .filter(w => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.lastFocused - a.lastFocused)
        
        state.activeWindowId = remainingWindows[0]?.id || null
      }
    },

    minimizeWindow: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const window = state.entities[id]
      if (window) {
        window.isMinimized = true
        if (state.activeWindowId === id) {
          state.activeWindowId = null
        }
      }
    },

    restoreWindow: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const window = state.entities[id]
      if (window) {
        window.isMinimized = false
        window.isOpen = true
        window.lastFocused = Date.now()
        state.activeWindowId = id
      }
    },

    maximizeWindow: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const window = state.entities[id]
      if (!window) return

      if (window.isFullscreen) {
        // Restore from fullscreen
        window.isFullscreen = false
        if (window.originalPosition) {
          window.position = window.originalPosition
          window.originalPosition = undefined
        }
        if (window.originalSize) {
          window.size = window.originalSize
          window.originalSize = undefined
        }
      } else {
        // Go fullscreen
        window.isFullscreen = true
        window.originalPosition = window.position
        window.originalSize = window.size
        window.position = { x: 0, y: 0 }
        window.size = {
          width: state.screenDimensions.width,
          height: state.screenDimensions.height - 32 // Account for navbar
        }
      }
    },

    focusWindow: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const window = state.entities[id]
      if (window) {
        window.zIndex = ++state.maxZIndex
        window.lastFocused = Date.now()
        state.activeWindowId = id
      }
    },

    // Optimized position updates for drag operations
    updateWindowPosition: (state, action: PayloadAction<{
      id: string
      position: { x: number; y: number }
    }>) => {
      const { id, position } = action.payload
      const window = state.entities[id]
      if (window) {
        window.position = position
      }
    },

    // Optimized size updates for resize operations
    updateWindowSize: (state, action: PayloadAction<{
      id: string
      size: { width: number; height: number }
    }>) => {
      const { id, size } = action.payload
      const window = state.entities[id]
      if (window) {
        window.size = size
      }
    },

    // Drag state management (separate from window state to prevent unnecessary re-renders)
    startDrag: (state, action: PayloadAction<{
      windowId: string
      offset: { x: number; y: number }
    }>) => {
      state.dragState = {
        isDragging: true,
        windowId: action.payload.windowId,
        offset: action.payload.offset
      }
    },

    endDrag: (state) => {
      state.dragState = {
        isDragging: false,
        windowId: null,
        offset: { x: 0, y: 0 }
      }
    },

    // Resize state management
    startResize: (state, action: PayloadAction<{
      windowId: string
      direction: string
      startSize: { width: number; height: number }
      startPos: { x: number; y: number }
    }>) => {
      state.resizeState = {
        isResizing: true,
        windowId: action.payload.windowId,
        direction: action.payload.direction,
        startSize: action.payload.startSize,
        startPos: action.payload.startPos
      }
    },

    endResize: (state) => {
      state.resizeState = {
        isResizing: false,
        windowId: null,
        direction: '',
        startSize: { width: 0, height: 0 },
        startPos: { x: 0, y: 0 }
      }
    },

    // UI state updates
    updateScreenDimensions: (state, action: PayloadAction<{
      width: number
      height: number
    }>) => {
      state.screenDimensions = action.payload
      const width = action.payload.width
      const height = action.payload.height
      state.isMobile = width < 768
      state.isSmallDesktop = width >= 768 && width < 1150
      state.isMediumDesktop = width >= 1150 && width < 1400

      // Re-clamp every window's position into the new viewport so a window
      // dragged near an edge isn't stranded off-screen after a resize. Keep
      // ≥100 px of the title bar reachable. Fullscreen windows track the
      // viewport size directly.
      const MIN_VISIBLE_TITLE_PX = 100
      const TITLE_BAR_HEIGHT = 30
      const NAVBAR_HEIGHT = 32
      for (const id of state.ids) {
        const w = state.entities[id]
        if (!w) continue
        if (w.isFullscreen) {
          w.position = { x: 0, y: 0 }
          w.size = { width, height: height - NAVBAR_HEIGHT }
          continue
        }
        const ww = w.size?.width ?? 300
        const minX = -(ww - MIN_VISIBLE_TITLE_PX)
        const maxX = width - MIN_VISIBLE_TITLE_PX
        const maxY = height - TITLE_BAR_HEIGHT
        w.position = {
          x: Math.max(minX, Math.min(w.position.x, maxX)),
          y: Math.max(0, Math.min(w.position.y, maxY)),
        }
      }
    }
  }
})

export const {
  openWindow,
  closeWindow,
  minimizeWindow,
  restoreWindow,
  maximizeWindow,
  focusWindow,
  updateWindowPosition,
  updateWindowSize,
  startDrag,
  endDrag,
  startResize,
  endResize,
  updateScreenDimensions
} = windowSlice.actions

export default windowSlice.reducer
