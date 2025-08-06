import { useState } from "react"
import { ImageGalleryGrid } from "./gallery/ImageGalleryGrid"
import { ImageGalleryViewer } from "./gallery/ImageGalleryViewer"
import { sampleGalleries } from "../data/galleries"

interface WindowContentsProps {
  iconType: string
}

export function WindowContents({ iconType }: WindowContentsProps) {
  const [count, setCount] = useState(0)

  // Different content based on which icon was clicked
  switch (iconType) {
    case "Movies":
      return sampleGalleries.movies ? (
        <ImageGalleryGrid gallery={sampleGalleries.movies} />
      ) : (
        <div className="p-2">
          <p>Gallery not found</p>
        </div>
      )

    case "Images":
      return sampleGalleries.images ? (
        <ImageGalleryGrid gallery={sampleGalleries.images} />
      ) : (
        <div className="p-2">
          <p>Gallery not found</p>
        </div>
      )

    case "Album Covers":
      return sampleGalleries.albumCovers ? (
        <ImageGalleryGrid gallery={sampleGalleries.albumCovers} />
      ) : (
        <div className="p-2">
          <p>Gallery not found</p>
        </div>
      )

    case "Customs":
      return sampleGalleries.customs ? (
        <ImageGalleryGrid gallery={sampleGalleries.customs} />
      ) : (
        <div className="p-2">
          <p>Gallery not found</p>
        </div>
      )

    case "Pelo mundo":
      return sampleGalleries.peloMundo ? (
        <ImageGalleryGrid gallery={sampleGalleries.peloMundo} />
      ) : (
        <div className="p-2">
          <p>Gallery not found</p>
        </div>
      )

    case "Rejects":
      return sampleGalleries.rejects ? (
        <ImageGalleryGrid gallery={sampleGalleries.rejects} />
      ) : (
        <div className="p-2">
          <p>Gallery not found</p>
        </div>
      )

    case "Desenhe":
      return sampleGalleries.paint ? (
        <ImageGalleryViewer 
          gallery={sampleGalleries.paint} 
          currentImageIndex={0}
          windowId="desenhe"
        />
      ) : (
        <div className="p-2">
          <p>Paint application not found</p>
        </div>
      )

    case "???":
      return sampleGalleries.pix ? (
        <ImageGalleryViewer 
          gallery={sampleGalleries.pix} 
          currentImageIndex={0}
          windowId="pix-viewer"
        />
      ) : (
        <div className="p-2">
          <p>Pix application not found</p>
        </div>
      )

    case "Error":
      return sampleGalleries.campominado ? (
        <ImageGalleryViewer 
          gallery={sampleGalleries.campominado} 
          currentImageIndex={0}
          windowId="campominado-viewer"
        />
      ) : (
        <div className="p-2">
          <p>Campominado game not found</p>
        </div>
      )

    case "Computer":
      return (
        <div className="p-2">
          <div className="field-row">
            <ul className="tree-view">
              <li>Local Disk (C:)</li>
              <li>CD Drive (D:)</li>
              <li>Network (Z:)</li>
            </ul>
          </div>
        </div>
      )

    case "Counter":
      return (
        <div className="p-2">
          <p style={{ textAlign: "center" }}>Current count: {count}</p>
          <div className="field-row" style={{ justifyContent: "center" }}>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(count - 1)}>-</button>
            <button onClick={() => setCount(0)}>0</button>
          </div>
        </div>
      )

    case "Contato":
      return (
        <div className="p-4">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/icons/envelope_closed-0.png"
              alt="Email"
              width={42}
              height={42}
              className="object-contain"
            />
            <div>
              <a 
                href="mailto:francisco.reis.skt@gmail.com"
                className="text-lg font-semibold !text-black hover:underline"
              >
                francisco.reis.skt@gmail.com
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <img
              src="/icons/camera-2.png"
              alt="Social Media"
              width={42}
              height={42}
              className="object-contain"
            />
            <div>
              <a 
                href="https://instagram.com/franciscoskt" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lg font-semibold !text-black hover:underline block"
              >
                @franciscoskt
              </a>
              <a 
                href="https://instagram.com/sktfrancisco" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lg font-semibold !text-black hover:underline block"
              >
                @sktfrancisco
              </a>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="p-2">
          <p>Content for {iconType} window</p>
          <div className="field-row">
            <button>OK</button>
            <button>Cancel</button>
          </div>
        </div>
      )
  }
}
