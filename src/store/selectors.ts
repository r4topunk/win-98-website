import { createSelector } from '@reduxjs/toolkit'
import { RootState } from './store'
import { WindowEntity } from './windowSlice'

// Basic selectors
export const selectWindowEntities = (state: RootState) => state.windows.entities
export const selectWindowIds = (state: RootState) => state.windows.ids
export const selectActiveWindowId = (state: RootState) => state.windows.activeWindowId
export const selectDragState = (state: RootState) => state.windows.dragState
export const selectResizeState = (state: RootState) => state.windows.resizeState
export const selectScreenDimensions = (state: RootState) => state.windows.screenDimensions
export const selectIsMobile = (state: RootState) => state.windows.isMobile

// Memoized selectors for expensive computations
export const selectAllWindows = createSelector(
  [selectWindowEntities, selectWindowIds],
  (entities, ids) => ids.map((id: string) => entities[id])
)

export const selectVisibleWindows = createSelector(
  [selectAllWindows],
  (windows: WindowEntity[]) => windows.filter((window: WindowEntity) => window.isOpen && !window.isMinimized)
)

export const selectWindowsByZIndex = createSelector(
  [selectVisibleWindows],
  (windows: WindowEntity[]) => [...windows].sort((a, b) => a.zIndex - b.zIndex)
)

export const selectActiveWindow = createSelector(
  [selectWindowEntities, selectActiveWindowId],
  (entities, activeId) => activeId ? entities[activeId] : null
)

export const selectWindowById = (id: string) =>
  createSelector(
    [selectWindowEntities],
    (entities) => entities[id]
  )

export const selectMinimizedWindows = createSelector(
  [selectAllWindows],
  (windows: WindowEntity[]) => windows.filter((window: WindowEntity) => window.isMinimized)
)

export const selectIsWindowDragging = (windowId: string) =>
  createSelector(
    [selectDragState],
    (dragState) => dragState.isDragging && dragState.windowId === windowId
  )

export const selectIsWindowResizing = (windowId: string) =>
  createSelector(
    [selectResizeState],
    (resizeState) => resizeState.isResizing && resizeState.windowId === windowId
  )
