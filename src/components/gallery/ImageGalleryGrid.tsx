import { ImageGallery } from "../../data/galleries"
import { cn } from "../../utils/cn"
import { VirtualImageGrid } from "./VirtualImageGrid"

interface ImageGalleryGridProps {
  gallery: ImageGallery
  className?: string
}

export function ImageGalleryGrid({
  gallery,
  className,
}: ImageGalleryGridProps) {
  return (
    <div className={cn("image-gallery-container h-full", className)}>
      <VirtualImageGrid gallery={gallery} />
    </div>
  )
}
