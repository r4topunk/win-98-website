import { useState } from "react"
import { ImageGalleryGrid } from "./gallery/ImageGalleryGrid"
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

    case "Desenhe":
      return sampleGalleries.desenhe ? (
        <ImageGalleryGrid gallery={sampleGalleries.desenhe} />
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
