import React, { createContext, useContext, useMemo, useCallback, useRef } from "react"

interface CacheEntry {
  content: React.ReactNode
  timestamp: number
  hit: number // Number of cache hits
}

interface CacheStats {
  hits: number
  misses: number
  entries: number
  memoryUsage: number
}

interface WindowContentCacheContextType {
  getCachedContent: (windowId: string, generator: () => React.ReactNode) => React.ReactNode
  invalidateCache: (windowId: string) => void
  clearCache: () => void
  getCacheStats: () => CacheStats
}

const WindowContentCacheContext = createContext<WindowContentCacheContextType | undefined>(undefined)

// Maximum number of cached windows before cleanup
const MAX_CACHE_SIZE = 20
// Cache entry TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

export const WindowContentCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())
  const statsRef = useRef({ hits: 0, misses: 0 })

  // Clean up expired cache entries
  const cleanupExpiredEntries = useCallback(() => {
    const now = Date.now()
    const cache = cacheRef.current
    
    for (const [windowId, entry] of cache) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(windowId)
      }
    }
  }, [])

  // LRU cache eviction when cache is full
  const evictLRUEntries = useCallback(() => {
    const cache = cacheRef.current
    
    if (cache.size <= MAX_CACHE_SIZE) return

    // Sort by least recently used (lowest hit count + oldest timestamp)
    const entries = Array.from(cache.entries())
      .sort(([,a], [,b]) => {
        const scoreA = a.hit + (a.timestamp / 1000000) // Combine hits with recency
        const scoreB = b.hit + (b.timestamp / 1000000)
        return scoreA - scoreB
      })

    // Remove oldest 20% of entries
    const toRemove = Math.max(1, Math.floor(cache.size * 0.2))
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0])
    }
  }, [])

  const getCachedContent = useCallback((windowId: string, generator: () => React.ReactNode): React.ReactNode => {
    const cache = cacheRef.current
    const stats = statsRef.current

    // Check if content is in cache
    const cached = cache.get(windowId)
    if (cached) {
      // Update hit count and return cached content
      cached.hit++
      cached.timestamp = Date.now() // Update access time
      stats.hits++
      return cached.content
    }

    // Generate new content
    stats.misses++
    const content = generator()
    
    // Store in cache
    cache.set(windowId, {
      content,
      timestamp: Date.now(),
      hit: 1
    })

    // Cleanup if needed
    cleanupExpiredEntries()
    evictLRUEntries()

    return content
  }, [cleanupExpiredEntries, evictLRUEntries])

  const invalidateCache = useCallback((windowId: string) => {
    cacheRef.current.delete(windowId)
  }, [])

  const clearCache = useCallback(() => {
    cacheRef.current.clear()
    statsRef.current = { hits: 0, misses: 0 }
  }, [])

  const getCacheStats = useCallback((): CacheStats => {
    const cache = cacheRef.current
    const stats = statsRef.current
    
    // Estimate memory usage (rough approximation)
    const memoryUsage = cache.size * 1024 // Assume 1KB per cached window on average
    
    return {
      hits: stats.hits,
      misses: stats.misses,
      entries: cache.size,
      memoryUsage
    }
  }, [])

  const contextValue = useMemo(() => ({
    getCachedContent,
    invalidateCache,
    clearCache,
    getCacheStats
  }), [getCachedContent, invalidateCache, clearCache, getCacheStats])

  return (
    <WindowContentCacheContext.Provider value={contextValue}>
      {children}
    </WindowContentCacheContext.Provider>
  )
}

// Hook to use the content cache
export const useWindowContentCache = () => {
  const context = useContext(WindowContentCacheContext)
  if (context === undefined) {
    throw new Error('useWindowContentCache must be used within a WindowContentCacheProvider')
  }
  return context
}

// Higher-order component to wrap window content with caching
export const withWindowContentCache = <P extends object>(
  Component: React.ComponentType<P>,
  cacheKey?: (props: P) => string
) => {
  const CachedComponent = React.memo((props: P) => {
    const { getCachedContent } = useWindowContentCache()
    
    // Generate cache key from props or use a default
    const windowId = cacheKey ? cacheKey(props) : JSON.stringify(props)
    
    return (
      <>
        {getCachedContent(windowId, () => <Component {...props} />)}
      </>
    )
  })

  CachedComponent.displayName = `CachedWindow(${Component.displayName || Component.name})`
  
  return CachedComponent
}
