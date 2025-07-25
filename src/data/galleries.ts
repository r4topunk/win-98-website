export interface GalleryImage {
  src: string
  alt: string
  title?: string
}

export interface ImageGallery {
  id: string
  name: string
  images: GalleryImage[]
}

// Artist's actual gallery data
export const sampleGalleries: Record<string, ImageGallery> = {
  movies: {
    id: "movies",
    name: "Movies & Videos",
    images: [
      {
        src: "/site_images/movies/1.webp",
        alt: "Movie Project 1",
        title: "Movie 1",
      },
      {
        src: "/site_images/movies/2.webp",
        alt: "Movie Project 2",
        title: "Movie 2",
      },
      {
        src: "/site_images/movies/3.webp",
        alt: "Movie Project 3",
        title: "Movie 3",
      },
      {
        src: "/site_images/movies/4.webp",
        alt: "Movie Project 4",
        title: "Movie 4",
      },
      {
        src: "/site_images/movies/5.webp",
        alt: "Movie Project 5",
        title: "Movie 5",
      },
      {
        src: "/site_images/movies/6.webp",
        alt: "Movie Project 6",
        title: "Movie 6",
      },
      {
        src: "/site_images/movies/7.webp",
        alt: "Movie Project 7",
        title: "Movie 7",
      },
      {
        src: "/site_images/movies/8.webp",
        alt: "Movie Project 8",
        title: "Movie 8",
      },
      {
        src: "/site_images/movies/9.webp",
        alt: "Movie Project 9",
        title: "Movie 9",
      },
      {
        src: "/site_images/movies/10.webp",
        alt: "Movie Project 10",
        title: "Movie 10",
      },
    ],
  },
  images: {
    id: "images",
    name: "Photography & Art",
    images: [
      {
        src: "/site_images/images/1.webp",
        alt: "Photography 1",
        title: "Image 1",
      },
      {
        src: "/site_images/images/2.webp",
        alt: "Photography 2",
        title: "Image 2",
      },
      {
        src: "/site_images/images/3.webp",
        alt: "Photography 3",
        title: "Image 3",
      },
      {
        src: "/site_images/images/4.webp",
        alt: "Photography 4",
        title: "Image 4",
      },
      {
        src: "/site_images/images/5.webp",
        alt: "Photography 5",
        title: "Image 5",
      },
      {
        src: "/site_images/images/6.webp",
        alt: "Photography 6",
        title: "Image 6",
      },
      {
        src: "/site_images/images/7.webp",
        alt: "Photography 7",
        title: "Image 7",
      },
      {
        src: "/site_images/images/8.webp",
        alt: "Photography 8",
        title: "Image 8",
      },
      {
        src: "/site_images/images/9.webp",
        alt: "Photography 9",
        title: "Image 9",
      },
      {
        src: "/site_images/images/10.webp",
        alt: "Photography 10",
        title: "Image 10",
      },
      {
        src: "/site_images/images/11.webp",
        alt: "Photography 11",
        title: "Image 11",
      },
      {
        src: "/site_images/images/12.webp",
        alt: "Photography 12",
        title: "Image 12",
      },
      {
        src: "/site_images/images/13.webp",
        alt: "Photography 13",
        title: "Image 13",
      },
      {
        src: "/site_images/images/14.webp",
        alt: "Photography 14",
        title: "Image 14",
      },
      {
        src: "/site_images/images/15.webp",
        alt: "Photography 15",
        title: "Image 15",
      },
      {
        src: "/site_images/images/16.webp",
        alt: "Photography 16",
        title: "Image 16",
      },
      {
        src: "/site_images/images/17.webp",
        alt: "Photography 17",
        title: "Image 17",
      },
      {
        src: "/site_images/images/18.webp",
        alt: "Photography 18",
        title: "Image 18",
      },
      {
        src: "/site_images/images/19.webp",
        alt: "Photography 19",
        title: "Image 19",
      },
      {
        src: "/site_images/images/20.webp",
        alt: "Photography 20",
        title: "Image 20",
      },
      {
        src: "/site_images/images/21.webp",
        alt: "Photography 21",
        title: "Image 21",
      },
    ],
  },
  albumCovers: {
    id: "albumCovers",
    name: "Album Covers",
    images: [
      {
        src: "/site_images/album_covers/1.webp",
        alt: "Album Cover 1",
        title: "Album Cover 1",
      },
      {
        src: "/site_images/album_covers/2.webp",
        alt: "Album Cover 2",
        title: "Album Cover 2",
      },
      {
        src: "/site_images/album_covers/3.webp",
        alt: "Album Cover 3",
        title: "Album Cover 3",
      },
      {
        src: "/site_images/album_covers/4.webp",
        alt: "Album Cover 4",
        title: "Album Cover 4",
      },
      {
        src: "/site_images/album_covers/5.webp",
        alt: "Album Cover 5",
        title: "Album Cover 5",
      },
      {
        src: "/site_images/album_covers/6.webp",
        alt: "Album Cover 6",
        title: "Album Cover 6",
      },
      {
        src: "/site_images/album_covers/7.webp",
        alt: "Album Cover 7",
        title: "Album Cover 7",
      },
      {
        src: "/site_images/album_covers/8.webp",
        alt: "Album Cover 8",
        title: "Album Cover 8",
      },
      {
        src: "/site_images/album_covers/9.webp",
        alt: "Album Cover 9",
        title: "Album Cover 9",
      },
      {
        src: "/site_images/album_covers/10.webp",
        alt: "Album Cover 10",
        title: "Album Cover 10",
      },
    ],
  },
  desenhe: {
    id: "desenhe",
    name: "Drawings & Illustrations",
    images: [
      {
        src: "/site_images/customs/1.webp",
        alt: "Custom Design 1",
        title: "Custom 1",
      },
      {
        src: "/site_images/customs/2.webp",
        alt: "Custom Design 2",
        title: "Custom 2",
      },
      {
        src: "/site_images/customs/3.webp",
        alt: "Custom Design 3",
        title: "Custom 3",
      },
      {
        src: "/site_images/customs/4.webp",
        alt: "Custom Design 4",
        title: "Custom 4",
      },
      {
        src: "/site_images/customs/5.webp",
        alt: "Custom Design 5",
        title: "Custom 5",
      },
      {
        src: "/site_images/customs/6.webp",
        alt: "Custom Design 6",
        title: "Custom 6",
      },
      {
        src: "/site_images/customs/7.webp",
        alt: "Custom Design 7",
        title: "Custom 7",
      },
      {
        src: "/site_images/customs/8.webp",
        alt: "Custom Design 8",
        title: "Custom 8",
      },
      {
        src: "/site_images/customs/9.webp",
        alt: "Custom Design 9",
        title: "Custom 9",
      },
      {
        src: "/site_images/customs/10.webp",
        alt: "Custom Design 10",
        title: "Custom 10",
      },
      {
        src: "/site_images/customs/11.webp",
        alt: "Custom Design 11",
        title: "Custom 11",
      },
      {
        src: "/site_images/customs/12.webp",
        alt: "Custom Design 12",
        title: "Custom 12",
      },
      {
        src: "/site_images/customs/13.webp",
        alt: "Custom Design 13",
        title: "Custom 13",
      },
      {
        src: "/site_images/customs/14.webp",
        alt: "Custom Design 14",
        title: "Custom 14",
      },
      {
        src: "/site_images/customs/15.webp",
        alt: "Custom Design 15",
        title: "Custom 15",
      },
      {
        src: "/site_images/customs/16.webp",
        alt: "Custom Design 16",
        title: "Custom 16",
      },
      {
        src: "/site_images/customs/17.webp",
        alt: "Custom Design 17",
        title: "Custom 17",
      },
      {
        src: "/site_images/customs/18.webp",
        alt: "Custom Design 18",
        title: "Custom 18",
      },
      {
        src: "/site_images/customs/19.webp",
        alt: "Custom Design 19",
        title: "Custom 19",
      },
      {
        src: "/site_images/customs/20.webp",
        alt: "Custom Design 20",
        title: "Custom 20",
      },
    ],
  },
  peloMundo: {
    id: "peloMundo",
    name: "Pelo Mundo",
    images: [
      {
        src: "/site_images/pelo_mundo/1.webp",
        alt: "Travel Photo 1",
        title: "Pelo Mundo 1",
      },
      {
        src: "/site_images/pelo_mundo/2.webp",
        alt: "Travel Photo 2",
        title: "Pelo Mundo 2",
      },
      {
        src: "/site_images/pelo_mundo/3.webp",
        alt: "Travel Photo 3",
        title: "Pelo Mundo 3",
      },
      {
        src: "/site_images/pelo_mundo/4.webp",
        alt: "Travel Photo 4",
        title: "Pelo Mundo 4",
      },
      {
        src: "/site_images/pelo_mundo/5.webp",
        alt: "Travel Photo 5",
        title: "Pelo Mundo 5",
      },
      {
        src: "/site_images/pelo_mundo/6.webp",
        alt: "Travel Photo 6",
        title: "Pelo Mundo 6",
      },
      {
        src: "/site_images/pelo_mundo/7.webp",
        alt: "Travel Photo 7",
        title: "Pelo Mundo 7",
      },
      {
        src: "/site_images/pelo_mundo/8.webp",
        alt: "Travel Photo 8",
        title: "Pelo Mundo 8",
      },
      {
        src: "/site_images/pelo_mundo/9.webp",
        alt: "Travel Photo 9",
        title: "Pelo Mundo 9",
      },
      {
        src: "/site_images/pelo_mundo/10.webp",
        alt: "Travel Photo 10",
        title: "Pelo Mundo 10",
      },
      {
        src: "/site_images/pelo_mundo/11.webp",
        alt: "Travel Photo 11",
        title: "Pelo Mundo 11",
      },
      {
        src: "/site_images/pelo_mundo/12.webp",
        alt: "Travel Photo 12",
        title: "Pelo Mundo 12",
      },
      {
        src: "/site_images/pelo_mundo/13.webp",
        alt: "Travel Photo 13",
        title: "Pelo Mundo 13",
      },
    ],
  },
  rejects: {
    id: "rejects",
    name: "Rejects",
    images: [
      {
        src: "/site_images/rejects/1.webp",
        alt: "Reject 1",
        title: "Reject 1",
      },
      {
        src: "/site_images/rejects/2.webp",
        alt: "Reject 2",
        title: "Reject 2",
      },
      {
        src: "/site_images/rejects/3.webp",
        alt: "Reject 3",
        title: "Reject 3",
      },
      {
        src: "/site_images/rejects/4.webp",
        alt: "Reject 4",
        title: "Reject 4",
      },
      {
        src: "/site_images/rejects/5.webp",
        alt: "Reject 5",
        title: "Reject 5",
      },
      {
        src: "/site_images/rejects/6.webp",
        alt: "Reject 6",
        title: "Reject 6",
      },
    ],
  },
}

// Helper function to get gallery by ID
export function getGalleryById(id: string): ImageGallery | undefined {
  return sampleGalleries[id]
}

// Helper function to get all gallery names for navigation
export function getAllGalleryNames(): Array<{ id: string; name: string }> {
  return Object.values(sampleGalleries).map((gallery) => ({
    id: gallery.id,
    name: gallery.name,
  }))
}
