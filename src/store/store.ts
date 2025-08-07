import { configureStore } from '@reduxjs/toolkit'
import windowReducer from './windowSlice'

export const store = configureStore({
  reducer: {
    windows: windowReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore ReactNode content in state
        ignoredActions: ['windows/openWindow'],
        ignoredPaths: ['windows.entities.*.content']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
