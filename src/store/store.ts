import { configureStore } from '@reduxjs/toolkit'
import windowReducer from './windowSlice'

export const store = configureStore({
  reducer: {
    windows: windowReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore ReactNode content in state for all window-related actions
        ignoredActions: [
          'windows/openWindow',
          'windows/closeWindow',
          'windows/minimizeWindow',
          'windows/restoreWindow',
          'windows/maximizeWindow',
          'windows/focusWindow',
          'windows/updateWindowPosition',
          'windows/updateWindowSize',
          'windows/startDrag',
          'windows/endDrag',
          'windows/startResize',
          'windows/endResize',
          'windows/updateScreenDimensions'
        ],
        ignoredPaths: ['windows.entities']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
