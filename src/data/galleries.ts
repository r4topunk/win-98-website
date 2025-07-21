export interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
}

export interface ImageGallery {
  id: string;
  name: string;
  images: GalleryImage[];
}

// Sample gallery data - replace with actual artist images
export const sampleGalleries: Record<string, ImageGallery> = {
  movies: {
    id: "movies",
    name: "Movies & Videos",
    images: [
      {
        src: "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Movie+1",
        alt: "Movie Project 1",
        title: "Short Film - Urban Dreams"
      },
      {
        src: "https://via.placeholder.com/400x225/4ECDC4/FFFFFF?text=Movie+2",
        alt: "Movie Project 2",
        title: "Music Video - Neon Nights"
      },
      {
        src: "https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Movie+3",
        alt: "Movie Project 3",
        title: "Documentary - City Stories"
      },
      {
        src: "https://via.placeholder.com/400x225/96CEB4/FFFFFF?text=Movie+4",
        alt: "Movie Project 4",
        title: "Animation - Digital Dreams"
      },
      {
        src: "https://via.placeholder.com/400x300/FFEAA7/333333?text=Movie+5",
        alt: "Movie Project 5",
        title: "Commercial - Brand Vision"
      },
      {
        src: "https://via.placeholder.com/400x225/DDA0DD/FFFFFF?text=Movie+6",
        alt: "Movie Project 6",
        title: "Experimental - Abstract Flow"
      },
    ]
  },
  images: {
    id: "images",
    name: "Photography & Art",
    images: [
      {
        src: "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Photo+1",
        alt: "Photography 1",
        title: "Portrait Series - Urban Youth"
      },
      {
        src: "https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Photo+2",
        alt: "Photography 2",
        title: "Landscape - Morning Light"
      },
      {
        src: "https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Photo+3",
        alt: "Photography 3",
        title: "Street Art Documentation"
      },
      {
        src: "https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Photo+4",
        alt: "Photography 4",
        title: "Architecture - Modern Lines"
      },
      {
        src: "https://via.placeholder.com/400x500/FFEAA7/333333?text=Photo+5",
        alt: "Photography 5",
        title: "Nature - Macro Study"
      },
      {
        src: "https://via.placeholder.com/400x400/DDA0DD/FFFFFF?text=Photo+6",
        alt: "Photography 6",
        title: "Abstract Compositions"
      },
      {
        src: "https://via.placeholder.com/400x300/F8B500/FFFFFF?text=Photo+7",
        alt: "Photography 7",
        title: "Event Photography"
      },
      {
        src: "https://via.placeholder.com/400x600/E17055/FFFFFF?text=Photo+8",
        alt: "Photography 8",
        title: "Fashion Portraits"
      },
    ]
  },
  albumCovers: {
    id: "albumCovers",
    name: "Album Covers",
    images: [
      {
        src: "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Album+1",
        alt: "Album Cover 1",
        title: "Electronic Dreams"
      },
      {
        src: "https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Album+2",
        alt: "Album Cover 2",
        title: "Jazz Sessions"
      },
      {
        src: "https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Album+3",
        alt: "Album Cover 3",
        title: "Rock Anthology"
      },
      {
        src: "https://via.placeholder.com/400x400/96CEB4/FFFFFF?text=Album+4",
        alt: "Album Cover 4",
        title: "Indie Folk Collection"
      },
      {
        src: "https://via.placeholder.com/400x400/FFEAA7/333333?text=Album+5",
        alt: "Album Cover 5",
        title: "Hip Hop Beats"
      },
      {
        src: "https://via.placeholder.com/400x400/DDA0DD/FFFFFF?text=Album+6",
        alt: "Album Cover 6",
        title: "Classical Remix"
      },
    ]
  },
  desenhe: {
    id: "desenhe",
    name: "Drawings & Illustrations",
    images: [
      {
        src: "https://via.placeholder.com/400x500/FF6B6B/FFFFFF?text=Drawing+1",
        alt: "Drawing 1",
        title: "Character Design - Hero"
      },
      {
        src: "https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Drawing+2",
        alt: "Drawing 2",
        title: "Landscape Sketch"
      },
      {
        src: "https://via.placeholder.com/400x600/45B7D1/FFFFFF?text=Drawing+3",
        alt: "Drawing 3",
        title: "Digital Illustration"
      },
      {
        src: "https://via.placeholder.com/400x400/96CEB4/FFFFFF?text=Drawing+4",
        alt: "Drawing 4",
        title: "Abstract Art"
      },
      {
        src: "https://via.placeholder.com/400x500/FFEAA7/333333?text=Drawing+5",
        alt: "Drawing 5",
        title: "Comic Panel"
      },
    ]
  }
};

// Helper function to get gallery by ID
export function getGalleryById(id: string): ImageGallery | undefined {
  return sampleGalleries[id];
}

// Helper function to get all gallery names for navigation
export function getAllGalleryNames(): Array<{ id: string; name: string }> {
  return Object.values(sampleGalleries).map(gallery => ({
    id: gallery.id,
    name: gallery.name
  }));
}
