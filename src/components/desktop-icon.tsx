import { useWindowContext } from "../contexts/WindowContext"
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

    // Determine appropriate window size for gallery content
    const isGallery = ["Movies", "Images", "Album Covers", "Desenhe"].includes(
      icon_name
    )

    // Check if mobile (basic check since we don't have access to WindowContext state here)
    const isMobile = window.innerWidth < 768

    let windowSize
    if (isGallery) {
      windowSize = isMobile
        ? {
            width: Math.min(320, window.innerWidth - 20),
            height: Math.min(400, window.innerHeight - 140),
          }
        : { width: 740, height: 540 } // Same size as Computer window
    } else {
      windowSize = isMobile
        ? {
            width: Math.min(280, window.innerWidth - 30),
            height: Math.min(300, window.innerHeight - 140),
          }
        : { width: 740, height: 540 } // Updated to new default size
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
