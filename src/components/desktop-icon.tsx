import { useWindowContext } from "../contexts/EnhancedWindowContext"
import { WindowContents } from "./WindowContents"

interface DesktopIconProps {
  icon_path: string
  icon_name: string
}

export function DesktopIcon({ icon_path, icon_name }: DesktopIconProps) {
  const { openWindow } = useWindowContext()

  const handleIconClick = () => {
    // Special case for Lojinha - open URL in new tab
    if (icon_name === "Lojinha") {
      window.open("https://franciscoskt.lojavirtualnuvem.com.br/", "_blank")
      return
    }

  // Special case for Shinkansen - open Instagram URL in new tab
  if (icon_name === "Shinkansen") {
      window.open("https://www.instagram.com/shinkansen.films/", "_blank")
      return
    }

    // Determine appropriate window size for gallery content
  const isGallery = ["Movies", "Images", "Album Covers", "Customs", "Pelo mundo", "Rejects"].includes(icon_name)
    const isPaint = icon_name === "Desenhe"
    const isPix = icon_name === "???"
    const isError = icon_name === "Error"
    const isContact = icon_name === "Contato"

    // Check screen size category
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768
    const isSmallDesktop = screenWidth >= 768 && screenWidth < 1100
    const isMediumDesktop = screenWidth >= 1100 && screenWidth < 1400

    let windowSize
    if (isPaint) {
      // For paint, calculate window size using the known image dimensions: 1654 × 1486
      const imageAspectRatio = 1654 / 1486 // ≈ 1.113
      const paintWidth = isMobile 
        ? Math.min(350, screenWidth - 20)
        : isSmallDesktop
        ? 280
        : isMediumDesktop
        ? 500
        : 500
      
      // Calculate height from width using the aspect ratio, then add space for window chrome
      const imageHeight = paintWidth / imageAspectRatio
      const windowChromeHeight = 30 // Account for title bar and borders
      const paintHeight = Math.round(imageHeight + windowChromeHeight)
      
      const dynamicWindowSize = { 
        width: Math.round(paintWidth), 
        height: paintHeight 
      }
      
      openWindow({
        id: icon_name.toLowerCase().replace(/\s/g, "-"),
        title: icon_name,
        content: <WindowContents iconType={icon_name} />,
        size: dynamicWindowSize,
        noScroll: true,
      })
      return
    } else if (isPix) {
      // For pix, calculate window size using the known image dimensions: 3028 × 4961
      const imageAspectRatio = 3028 / 4961 // ≈ 0.610
      const pixWidth = isMobile 
        ? Math.min(350, screenWidth - 20)
        : isSmallDesktop
        ? 180
        : isMediumDesktop
        ? 280
        : 350
      
      // Calculate height from width using the aspect ratio, then add space for window chrome
      const imageHeight = pixWidth / imageAspectRatio
      const windowChromeHeight = 30 // Account for title bar and borders
      const pixHeight = Math.round(imageHeight + windowChromeHeight)
      
      const dynamicWindowSize = { 
        width: Math.round(pixWidth), 
        height: pixHeight 
      }
      
      openWindow({
        id: "pix-viewer",
        title: icon_name,
        content: <WindowContents iconType={icon_name} />,
        size: dynamicWindowSize,
        noScroll: true,
      })
      return
    } else if (isError) {
      // For campominado, calculate window size using the known image dimensions: 2970 × 3776
      const imageAspectRatio = 2970 / 3776 // ≈ 0.786
      const errorWidth = isMobile 
        ? Math.min(350, screenWidth - 20)
        : isSmallDesktop
        ? 200
        : isMediumDesktop
        ? 300
        : 300
      
      // Calculate height from width using the aspect ratio, then add space for window chrome
      const imageHeight = errorWidth / imageAspectRatio
      const windowChromeHeight = 30 // Account for title bar and borders
      const errorHeight = Math.round(imageHeight + windowChromeHeight)
      
      const dynamicWindowSize = { 
        width: Math.round(errorWidth), 
        height: errorHeight 
      }
      
      openWindow({
        id: "campominado-viewer",
        title: icon_name,
        content: <WindowContents iconType={icon_name} />,
        size: dynamicWindowSize,
        noScroll: true,
      })
      return
    } else if (isContact) {
      // For contact, use a smaller window that fits the content
      const contactSize = isMobile
        ? {
            width: Math.min(320, screenWidth - 20),
            height: 200,
          }
        : isSmallDesktop
        ? { width: 260, height: 140 }
        : isMediumDesktop
        ? { width: 380, height: 190 }
        : { width: 400, height: 200 }
      
      openWindow({
        id: "contato",
        title: icon_name,
        content: <WindowContents iconType={icon_name} />,
        size: contactSize,
        noScroll: true,
      })
      return
    } else if (isGallery) {
      windowSize = isMobile
        ? {
            width: Math.min(320, screenWidth - 20),
            height: Math.min(400, window.innerHeight - 140),
          }
        : isSmallDesktop
        ? { width: 320, height: 260 }
        : isMediumDesktop
        ? { width: 500, height: 400 }
        : { width: 740, height: 540 }
    } else {
      // Default windows (including Computer). Make Computer 16:9
      if (icon_name === "Computer") {
        // Choose width based on device and derive height from 16:9
        const baseWidth = isMobile
          ? Math.min(360, screenWidth - 20)
          : isSmallDesktop
          ? 380
          : isMediumDesktop
          ? 600
          : 800
        const baseHeight = isMobile
          ? Math.min(500, window.innerHeight - 100) // Increased height for mobile text reading
          : Math.round((baseWidth * 9) / 16)
        windowSize = { width: baseWidth, height: baseHeight }
      } else {
        windowSize = isMobile
          ? {
              width: Math.min(280, screenWidth - 30),
              height: Math.min(300, window.innerHeight - 140),
            }
          : isSmallDesktop
          ? { width: 320, height: 260 }
          : isMediumDesktop
          ? { width: 600, height: 480 }
          : { width: 740, height: 540 }
      }
    }

    openWindow({
      id: icon_name.toLowerCase().replace(/\s/g, "-"),
      title: icon_name,
      content: <WindowContents iconType={icon_name} />,
      size: windowSize,
    })
  }

  return (
    <button
      onClick={handleIconClick}
      className="flex flex-col gap-1 items-center justify-center p-2! bg-transparent! shadow-none! cursor-pointer w-full"
    >
      <img
        src={icon_path}
        alt={icon_name}
        width={32}
        className="pointer-events-none"
      />
      <p className="font-['Pixelated MS Sans Serif'] text-white font-light!">
        {icon_name}
      </p>
    </button>
  )
}
