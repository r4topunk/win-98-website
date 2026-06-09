import { useEffect, useState, useRef, lazy, Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { Navbar } from "./components/navbar"
import { Desktop } from "./components/desktop"
// Enhanced Redux-based window management with backward compatibility
import { WindowProvider, useWindowContext } from "./contexts/EnhancedWindowContext"
import { GalleriesProvider } from "./hooks/useGalleries"
import { VirtualWindowManager } from "./components/VirtualWindowManager"
import { IntroVideo } from "./components/IntroVideo"
import { VintageTransition } from "./components/VintageTransition"
import { CRTEffect } from "./components/CRTEffect"
import { WindowContents } from "./components/WindowContents"
import { playClick } from "./services/sound"

// Shareable per-window deep links. URL hash is the source of truth for
// "what window should be open" — visiting #movies opens the Movies window,
// focusing a window writes its slug into the hash, and browser Back closes
// the front window instead of exiting the site.
//
// windowId is the same id desktop-icon.tsx uses, so opening from a hash
// hits the existing-window branch of openWindow if the icon was already
// clicked, and the icon click hits the existing-window branch if you opened
// via the hash. No double windows.
const ROUTABLE: Array<{ slug: string; iconName: string; windowId: string }> = [
  { slug: "bio", iconName: "Computer", windowId: "computer" },
  { slug: "movies", iconName: "Movies", windowId: "movies" },
  { slug: "images", iconName: "Images", windowId: "images" },
  { slug: "album-covers", iconName: "Album Covers", windowId: "album-covers" },
  { slug: "customs", iconName: "Customs", windowId: "customs" },
  { slug: "pelo-mundo", iconName: "Pelo mundo", windowId: "pelo-mundo" },
  { slug: "rejects", iconName: "Rejects", windowId: "rejects" },
  { slug: "desenhe", iconName: "Desenhe", windowId: "desenhe" },
  { slug: "pix", iconName: "???", windowId: "pix-viewer" },
  { slug: "error", iconName: "Error", windowId: "campominado-viewer" },
  { slug: "contato", iconName: "Contato", windowId: "contato" },
]
const SLUG_TO_ROUTE: Record<string, (typeof ROUTABLE)[number]> = Object.fromEntries(
  ROUTABLE.map((r) => [r.slug, r]),
)
const WINDOW_ID_TO_SLUG: Record<string, string> = Object.fromEntries(
  ROUTABLE.map((r) => [r.windowId, r.slug]),
)

function HashRouter() {
  const { windows, activeWindowId, openWindow, closeWindow, focusWindow } = useWindowContext()
  // Ref so the popstate handler (bound once) reads the latest windows list.
  const windowsRef = useRef(windows)
  useEffect(() => {
    windowsRef.current = windows
  }, [windows])

  // Mount: if the URL has a deep link, open the matching window. Runs once.
  useEffect(() => {
    if (typeof window === "undefined") return
    const slug = window.location.hash.replace(/^#/, "")
    if (!slug) return
    const route = SLUG_TO_ROUTE[slug]
    if (!route) return
    openWindow({
      id: route.windowId,
      title: route.iconName,
      content: <WindowContents iconType={route.iconName} />,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reflect the focused window in the URL using replaceState (no extra
  // history entries — keeps Back behavior predictable as "close one window").
  useEffect(() => {
    if (typeof window === "undefined") return
    const slug = activeWindowId ? WINDOW_ID_TO_SLUG[activeWindowId] ?? "" : ""
    const desired = slug ? `#${slug}` : ""
    if (desired === window.location.hash) return
    const url = window.location.pathname + window.location.search + desired
    window.history.replaceState(null, "", url)
  }, [activeWindowId])

  // Browser Back/Forward: empty hash = close the top window (Esc semantics);
  // route hash = open or focus the matching window.
  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = () => {
      const slug = window.location.hash.replace(/^#/, "")
      const list = windowsRef.current
      if (!slug) {
        const top = [...list]
          .filter((w) => w.isOpen && !w.isMinimized)
          .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))[0]
        if (top) closeWindow(top.id)
        return
      }
      const route = SLUG_TO_ROUTE[slug]
      if (!route) return
      const existing = list.find((w) => w.id === route.windowId)
      if (existing) {
        focusWindow(route.windowId)
      } else {
        openWindow({
          id: route.windowId,
          title: route.iconName,
          content: <WindowContents iconType={route.iconName} />,
        })
      }
    }
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [openWindow, closeWindow, focusWindow])

  return null
}

// Keep the browser tab title in sync with the focused window so back-tab
// scanning ("which tab is the gallery I had open?") works. Reverts to the
// base title when no window is focused (e.g. after minimizing the front
// window). Must live inside WindowProvider to read the context.
function DocumentTitle() {
  const { windows, activeWindowId } = useWindowContext()
  useEffect(() => {
    const baseTitle = "Francisco H. — franciscoskt"
    if (!activeWindowId) {
      document.title = baseTitle
      return
    }
    const focused = windows.find((w) => w.id === activeWindowId)
    document.title = focused?.title ? `${focused.title} — franciscoskt` : baseTitle
  }, [windows, activeWindowId])
  return null
}

// Items shown in the Start menu. Each one opens the matching window via
// WindowContents — the same content path desktop icons use. External
// links (Lojinha, Shinkansen) bail out to a new tab.
const START_MENU_ITEMS: Array<{
  icon: string
  label: string
  iconName: string
}> = [
  { icon: "/icons/computer_explorer_cool-0.png", label: "Bio", iconName: "Computer" },
  { icon: "/icons/camera3_vid-2.png", label: "Movies", iconName: "Movies" },
  { icon: "/icons/camera3-2.png", label: "Images", iconName: "Images" },
  { icon: "/icons/cd_audio_cd_a-3.png", label: "Album Covers", iconName: "Album Covers" },
  { icon: "/icons/network_internet_pcs_installer-4.png", label: "Customs", iconName: "Customs" },
  { icon: "/icons/world-4.png", label: "Pelo mundo", iconName: "Pelo mundo" },
  { icon: "/icons/recycle_bin_full-4.png", label: "Rejects", iconName: "Rejects" },
  { icon: "/icons/imaggif-1.png", label: "Desenhe", iconName: "Desenhe" },
  { icon: "/icons/modem-5.png", label: "Contato", iconName: "Contato" },
  { icon: "/icons/msagent-3.png", label: "Lojinha", iconName: "Lojinha" },
  { icon: "/icons/directory_movie-4.png", label: "Shinkansen", iconName: "Shinkansen" },
]

function StartMenu({ onClose }: { onClose: () => void }) {
  const { openWindow } = useWindowContext()

  const launch = (iconName: string) => {
    if (iconName === "Lojinha") {
      window.open("https://franciscoskt.lojavirtualnuvem.com.br/", "_blank")
      onClose()
      return
    }
    if (iconName === "Shinkansen") {
      window.open("https://www.instagram.com/shinkansen.films/", "_blank")
      onClose()
      return
    }
    openWindow({
      id: iconName.toLowerCase().replace(/\s/g, "-"),
      title: iconName,
      content: <WindowContents iconType={iconName} />,
    })
    onClose()
  }

  return (
    <div
      role="menu"
      aria-label="Menu Iniciar"
      className="window p-0!"
      style={{ width: 220, display: "flex" }}
    >
      {/* Vertical Win98 banner strip on the left — purely decorative but
          recognizable; keeps the chrome feeling authentic. */}
      <div
        aria-hidden="true"
        style={{
          background: "#808080",
          color: "#fff",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          padding: "8px 4px",
          fontFamily: "'Pixelated MS Sans Serif', sans-serif",
          fontSize: 16,
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>
          <b>Windows</b>98
        </span>
      </div>

      <ul
        className="flex-1 m-0 p-0"
        style={{ listStyle: "none", background: "#c0c0c0" }}
      >
        {START_MENU_ITEMS.map((item) => (
          <li key={item.iconName}>
            <button
              role="menuitem"
              type="button"
              onClick={() => launch(item.iconName)}
              className="w-full flex items-center gap-2 px-2 py-1 text-left bg-transparent! shadow-none! hover:bg-[#000080] hover:text-white"
              style={{ font: "inherit", fontSize: 12 }}
            >
              <img
                src={item.icon}
                alt=""
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Lazy-load admin surface so public visitors don't download AdminApp/AdminPanel
// (and any admin-only Supabase auth code paths) in the main bundle.
const AdminApp = lazy(() =>
  import("./components/admin/AdminApp").then((m) => ({ default: m.AdminApp })),
)

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-3 bg-red-100 border border-red-400 text-red-800 text-sm font-['Pixelated MS Sans Serif']">
      <p>Something went wrong.</p>
      <pre className="whitespace-pre-wrap break-words text-xs mt-1">{error.message}</pre>
    </div>
  )
}

function isAdminRoute(): boolean {
  if (typeof window === "undefined") return false
  return window.location.pathname.replace(/\/+$/, "") === "/admin"
}

function AdminPage() {
  return (
    <GalleriesProvider>
      <div className="min-h-[100dvh] bg-[#008080] p-4 md:p-8">
        <div className="max-w-3xl mx-auto window">
          <div className="title-bar">
            <div className="title-bar-text">Admin — content manager</div>
          </div>
          <div className="window-body" style={{ margin: 0, padding: 0 }}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={null}>
                <AdminApp />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </GalleriesProvider>
  )
}

// Returning visitors who already watched the intro shouldn't pay the 600 KB
// video tax again. Wrapped in try/catch for Safari private mode where
// localStorage throws on access.
const INTRO_WATCHED_KEY = "introWatched"
function shouldShowIntro(): boolean {
  if (typeof window === "undefined") return false
  try {
    return !localStorage.getItem(INTRO_WATCHED_KEY)
  } catch {
    return true
  }
}
function markIntroWatched() {
  try {
    localStorage.setItem(INTRO_WATCHED_KEY, "1")
  } catch {
    // Safari private mode — fine to ignore, intro will replay next visit.
  }
}

function DesktopApp() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(shouldShowIntro)
  const [showTransition, setShowTransition] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = () => playClick()
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKey)
    }
  }, [isMenuOpen])

  const handleIntroComplete = () => {
    markIntroWatched()
    setShowTransition(true)
  }

  const handleTransitionComplete = () => {
    setShowIntro(false)
    setShowTransition(false)
  }

  return (
    <WindowProvider>
      <GalleriesProvider>
        <DocumentTitle />
        <HashRouter />
        {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
        {showTransition && (
          <VintageTransition onComplete={handleTransitionComplete} />
        )}
        <CRTEffect>
          {/*
            lg:h-[80vh] aligns the desktop-shrink behavior with the body
            zoom 1.25 rule (which activates at min-width: 1024px). With the
            old md:h-[80vh] the desktop shrank at 768 px but the zoom didn't
            kick in until 1024 px, leaving a ~20% dead band on tablet
            portrait.
          */}
          <div className="bg-[url('/site_images/ui/background.webp')] bg-cover bg-no-repeat bg-center relative overflow-hidden flex flex-col h-[100dvh] lg:h-[80vh] desktop-background">
            <Desktop />
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <VirtualWindowManager />
            </ErrorBoundary>
            <Navbar openStartMenu={() => setIsMenuOpen(!isMenuOpen)} />
            {isMenuOpen && (
              <div ref={menuRef} className="absolute bottom-8 left-0 z-50">
                <StartMenu onClose={() => setIsMenuOpen(false)} />
              </div>
            )}
          </div>
        </CRTEffect>
      </GalleriesProvider>
    </WindowProvider>
  )
}

export default function App() {
  return isAdminRoute() ? <AdminPage /> : <DesktopApp />
}
