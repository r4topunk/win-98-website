// Compact window size for the "Desenhe" Paint app, sized to fit the editor
// content (canvas + palette + tools + save) snugly so the window isn't mostly
// empty space. Shared by every open path (desktop icon, deep-link hash, Start
// menu) so they agree. Sizes are CSS px (pre-zoom); windowSlice clamps to the
// viewport.
export function paintWindowSize(): { width: number; height: number } {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200
  const h = typeof window !== "undefined" ? window.innerHeight : 800
  if (w < 768) {
    return {
      width: Math.min(380, w - 20),
      height: Math.min(580, h - 100),
    }
  }
  if (w < 1150) return { width: 360, height: 520 }
  return { width: 420, height: 580 }
}
