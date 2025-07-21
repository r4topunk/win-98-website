import { GalleryImage, ImageGallery } from "../../data/galleries";
import { useWindowContext } from "../../contexts/WindowContext";
import { cn } from "../../utils/cn";
import { ImageGalleryViewer } from "./ImageGalleryViewer";

interface ImageGalleryGridProps {
  gallery: ImageGallery;
  className?: string;
}

export function ImageGalleryGrid({ gallery, className }: ImageGalleryGridProps) {
  const { openWindow } = useWindowContext();

  const handleImageClick = (image: GalleryImage, index: number) => {
    // Open image viewer window with full gallery context
    openWindow({
      id: `${gallery.id}-viewer-${index}`,
      title: `${gallery.name} - ${image.title || `Image ${index + 1}`}`,
      content: (
        <ImageGalleryViewer
          gallery={gallery} 
          currentImageIndex={index} 
        />
      ),
      size: { width: 700, height: 550 }
    });
  };

  return (
    <div className={cn("image-gallery-grid h-full flex flex-col", className)}>
      {/* Grid layout that adapts to window size */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-full">
          {gallery.images.map((image, index) => (
            <div 
              key={index}
              className="gallery-image-item cursor-pointer group"
              onClick={() => handleImageClick(image, index)}
            >
              {/* Image container with aspect ratio preservation */}
              <div className="aspect-square bg-gray-200 border border-gray-400 overflow-hidden group-hover:border-blue-400 transition-colors w-full">
                <img 
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </div>
              
              {/* Image title/caption */}
              {image.title && (
                <p className="text-xs mt-1 text-center truncate font-['Pixelated MS Sans Serif'] px-1">
                  {image.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Gallery info */}
      <div className="p-2 border-t border-gray-400 bg-gray-100 flex-shrink-0">
        <p className="text-sm font-['Pixelated MS Sans Serif']">
          {gallery.images.length} image{gallery.images.length !== 1 ? 's' : ''} in {gallery.name}
        </p>
      </div>
    </div>
  );
}
