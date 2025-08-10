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
  const isGallery = ["Movies", "Images", "Album Covers"].includes(icon_name)
    const isPaint = icon_name === "Desenhe"
    const isPix = icon_name === "???"
    const isError = icon_name === "Error"
    const isContact = icon_name === "Contato"

    // Check if mobile (basic check since we don't have access to WindowContext state here)
    const isMobile = window.innerWidth < 768

    let windowSize
    if (isPaint) {
      // For paint, calculate window size using the known image dimensions: 1654 × 1486
      const imageAspectRatio = 1654 / 1486 // ≈ 1.113
      const paintWidth = isMobile ? Math.min(350, window.innerWidth - 20) : 500
      
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
      const pixWidth = isMobile ? Math.min(350, window.innerWidth - 20) : 350
      
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
      const errorWidth = isMobile ? Math.min(350, window.innerWidth - 20) : 300
      
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
            width: Math.min(320, window.innerWidth - 20),
            height: 200,
          }
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
            width: Math.min(320, window.innerWidth - 20),
            height: Math.min(400, window.innerHeight - 140),
          }
        : { width: 740, height: 540 } // Same size as Computer window
    } else {
      // Default windows (including Computer). Make Computer 16:9
      if (icon_name === "Computer") {
        // Choose width based on device and derive height from 16:9
        const baseWidth = isMobile
          ? Math.min(360, window.innerWidth - 20)
          : 800
        const baseHeight = Math.round((baseWidth * 9) / 16)
        windowSize = { width: baseWidth, height: baseHeight }
      } else {
        windowSize = isMobile
          ? {
              width: Math.min(280, window.innerWidth - 30),
              height: Math.min(300, window.innerHeight - 140),
            }
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
