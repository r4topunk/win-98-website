// Scheme allowlist for any user-/data-driven URL that gets handed to
// window.open() or an <a href>. Blocks javascript:, data:, blob:, vbscript:
// and similar script-bearing schemes that would otherwise turn a link into an
// XSS / opener-hijack sink. Used by the gallery viewer (images.link) so the
// pre-existing window.open(link) calls can't be abused.

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

/** Returns a normalized URL string if it uses a safe scheme, else null. */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    // Resolve relative inputs against the current origin; absolute inputs keep
    // their own scheme. A "javascript:..." string parses with protocol
    // "javascript:" and is rejected below.
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    const u = new URL(trimmed, base)
    return ALLOWED_PROTOCOLS.has(u.protocol) ? u.href : null
  } catch {
    return null
  }
}

/** Opens a URL in a new tab only if it passes the scheme allowlist. */
export function openExternal(raw: string | null | undefined): void {
  const safe = safeExternalUrl(raw)
  if (safe && typeof window !== "undefined") {
    window.open(safe, "_blank", "noopener,noreferrer")
  }
}
