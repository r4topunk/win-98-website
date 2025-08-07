import { memo } from "react"
import { useWindowContentCache } from "../contexts/WindowContentCacheContext"
import { VirtualWindowManager } from "./VirtualWindowManager"

export const OptimizedWindowManager = memo(() => {
  const { getCacheStats } = useWindowContentCache()
  
  // Log cache performance in development (safely check for dev environment)
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    const stats = getCacheStats()
    if (stats.hits + stats.misses > 0) {
      console.log('Window Content Cache Stats:', {
        ...stats,
        hitRate: ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%'
      })
    }
  }

  return <VirtualWindowManager />
})

OptimizedWindowManager.displayName = "OptimizedWindowManager"
