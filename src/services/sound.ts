import { Howl } from "howler"

// Preloaded, pooled UI sounds
const clickHowl = new Howl({
  src: ["/mouse-click.wav"],
  volume: 0.75,
  preload: true,
})

export function playClick() {
  // Howler internally pools audio nodes; this avoids new Audio() churn
  try {
    clickHowl.play()
  } catch {
    // No-op: browsers may block until first user interaction
  }
}
