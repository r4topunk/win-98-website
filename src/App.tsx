import { useEffect, useState, useRef } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { Navbar } from "./components/navbar"
import { Desktop } from "./components/desktop"
// Enhanced Redux-based window management with backward compatibility
import { WindowProvider } from "./contexts/EnhancedWindowContext"
import { WindowContentCacheProvider } from "./contexts/WindowContentCacheContext"
import { OptimizedWindowManager } from "./components/OptimizedWindowManager"
import { IntroVideo } from "./components/IntroVideo"
import { VintageTransition } from "./components/VintageTransition"
import { CRTEffect } from "./components/CRTEffect"
import { playClick } from "./services/sound"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-800 text-sm font-['Pixelated MS Sans Serif']">
      <p>Something went wrong.</p>
      <pre className="whitespace-pre-wrap break-words text-xs mt-1">{error.message}</pre>
    </div>
  )
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showTransition, setShowTransition] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
  const handleClick = () => playClick()
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  const handleIntroComplete = () => {
    setShowTransition(true)
  }

  const handleTransitionComplete = () => {
    setShowIntro(false)
    setShowTransition(false)
  }

  return (
    <WindowProvider>
      <WindowContentCacheProvider>
        {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
        {showTransition && (
          <VintageTransition onComplete={handleTransitionComplete} />
        )}
        <CRTEffect>
          <div className="bg-[url('/site_images/ui/background.webp')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[100dvh] md:h-[80vh] desktop-background">
            <Desktop />
            {/* Enhanced Redux-based WindowManager with advanced performance optimizations */}
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <OptimizedWindowManager />
            </ErrorBoundary>
            <Navbar openStartMenu={() => setIsMenuOpen(!isMenuOpen)} />
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute bottom-8 left-0 z-50"
              >
                <img 
                  src="/site_images/ui/menu.webp" 
                  alt="Start Menu" 
                  className="w-full max-w-[200px] h-auto block shadow-lg"
                />
              </div>
            )}
          </div>
        </CRTEffect>
      </WindowContentCacheProvider>
    </WindowProvider>
  )
}

export default App
