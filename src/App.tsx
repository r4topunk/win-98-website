import { useEffect, useState, useRef } from "react"
import { Navbar } from "./components/navbar"
import { Desktop } from "./components/desktop"
import { WindowProvider } from "./contexts/WindowContext"
import { WindowManager } from "./components/WindowManager"
import { IntroVideo } from "./components/IntroVideo"
import { VintageTransition } from "./components/VintageTransition"
import { CRTEffect } from "./components/CRTEffect"

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showTransition, setShowTransition] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const playSound = () => {
    const sound = new Audio("/mouse-click.wav")
    sound.volume = 0.75
    sound.play()
  }

  useEffect(() => {
    const handleClick = () => playSound()
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
      {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
      {showTransition && (
        <VintageTransition onComplete={handleTransitionComplete} />
      )}
      <CRTEffect>
        <div className="bg-[url('/bg.jpg')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[100dvh] md:h-[80vh] desktop-background">
          <Desktop />
          <WindowManager />
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
    </WindowProvider>
  )
}

export default App
