import { useMemo } from "react"
import { sampleGalleries } from "../../data/galleries"

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").split("/")[0] || null
    }
    // youtube.com/watch?v=<id>
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v")
    }
    // youtube.com/shorts/<id>
    if (u.pathname.startsWith("/shorts/")) {
      const parts = u.pathname.split("/")
      return parts[2] || null
    }
    // youtube.com/embed/<id>
    if (u.pathname.startsWith("/embed/")) {
      const parts = u.pathname.split("/")
      return parts[2] || null
    }
    return null
  } catch {
    return null
  }
}

function toEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url)
  if (!id) return null
  // Keep it simple: no autoplay by default to avoid blocked playback; include modest branding
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
}

export function RandomYouTubePlayer() {
  const { videoTitle, embedUrl } = useMemo(() => {
    const images = sampleGalleries.movies?.images || []
    const allowed = new Set([
      "FILME DO ANO",
      "HYAKU-EN",
      "FITA DESCONHECIDA",
      "COVID TOUR 2020",
      "INFRALAX",
    ])
    const withLinks = images.filter((img) => typeof img.link === "string" && img.link?.length)
    // Restrict to specified titles only
    const restricted = withLinks.filter((img) => img.title && allowed.has(img.title.toUpperCase()))
    const pool = restricted.length > 0 ? restricted : []
    if (pool.length === 0) {
      return { videoTitle: "No videos found", embedUrl: null as string | null }
    }
    const random = pool[Math.floor(Math.random() * pool.length)]
    return {
      videoTitle: random.title || random.alt || "Video",
      embedUrl: toEmbedUrl(random.link as string),
    }
  }, [])

  if (!embedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <p className="text-sm font-['Pixelated MS Sans Serif']">Unable to load video</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <iframe
        title={videoTitle}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
