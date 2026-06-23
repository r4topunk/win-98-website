// Data-access layer for the community pixel-art mural.
//
// Security model (enforced in Postgres, see supabase/schema.sql):
//   - anon may SELECT only `hidden = false` rows, and may INSERT only the
//     three user columns (author_name, message, png_data). No UPDATE/DELETE.
//   - admins (admins-table membership) may do everything, incl. read hidden.
// Everything in this file is a thin wrapper over those policies. Client-side
// limits below mirror the DB CHECK constraints purely for fast UX feedback —
// they are NOT a security boundary (the DB is).

import { isSupabaseConfigured, supabase } from "./supabase"
import type { DrawingRow } from "./types"

// Logical pixel grid. Fixed + small so PNGs stay tiny (~1-2 KB base64).
export const CANVAS_SIZE = 64

// Mirrors the schema.sql CHECK constraints (client-side feedback only).
export const MAX_NAME_LEN = 40
export const MAX_MESSAGE_LEN = 280
export const MAX_PNG_LEN = 6000

// Mural page size; matches the drawings_visible_idx ordering.
export const PAGE_SIZE = 24

// UX-only debounce against accidental double-submits. NOT a security control
// (a direct REST call never touches this) — the Postgres rate trigger is.
export const SUBMIT_COOLDOWN_MS = 30_000
const COOLDOWN_KEY = "drawingLastSubmit"

export function cooldownRemainingMs(): number {
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0)
    if (!last) return 0
    return Math.max(0, SUBMIT_COOLDOWN_MS - (Date.now() - last))
  } catch {
    return 0
  }
}

function markSubmitted() {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
  } catch {
    // Safari private mode — fine to ignore; the DB trigger still throttles.
  }
}

// Columns the public mural needs. `png_data` is included because the image is
// inline; rows are capped (PAGE_SIZE) and the table is bounded by a row-cap
// trigger, so payload stays small.
const PUBLIC_COLS = "id,author_name,message,png_data,created_at"

export interface SubmitDrawingInput {
  authorName: string
  message: string
  /** RAW base64 (no "data:" prefix). */
  pngData: string
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "cooldown" | "not-configured" | "rate-limit" | "error"; message: string }

/** Insert a visitor drawing. Sends only the three writable columns. */
export async function submitDrawing(input: SubmitDrawingInput): Promise<SubmitResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Salvar desenhos está indisponível neste preview.",
    }
  }
  const remaining = cooldownRemainingMs()
  if (remaining > 0) {
    return {
      ok: false,
      reason: "cooldown",
      message: `Espere ${Math.ceil(remaining / 1000)}s antes de enviar outro desenho.`,
    }
  }

  const { error } = await supabase.from("drawings").insert({
    author_name: input.authorName,
    message: input.message,
    png_data: input.pngData,
  })

  if (error) {
    // The Postgres rate trigger raises a message containing "rate limit".
    if (/rate limit/i.test(error.message)) {
      return {
        ok: false,
        reason: "rate-limit",
        message: "Muita gente desenhando agora. Tente de novo em instantes.",
      }
    }
    return { ok: false, reason: "error", message: error.message }
  }

  markSubmitted()
  return { ok: true }
}

/** Public mural read: visible rows, newest first, paginated. */
export async function fetchVisibleDrawings(
  offset: number,
  limit = PAGE_SIZE,
): Promise<DrawingRow[]> {
  const { data, error } = await supabase
    .from("drawings")
    .select(PUBLIC_COLS)
    .eq("hidden", false) // double-enforced by RLS; explicit for clarity
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return (data ?? []) as DrawingRow[]
}

// ---- Admin-only (requires an authenticated admin session) ----

const ADMIN_COLS = "id,author_name,message,png_data,hidden,created_at"

/** Admin read: ALL drawings incl. hidden (RLS admin policy permits it). */
export async function fetchAllDrawings(
  offset: number,
  limit = PAGE_SIZE,
): Promise<DrawingRow[]> {
  const { data, error } = await supabase
    .from("drawings")
    .select(ADMIN_COLS)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return (data ?? []) as DrawingRow[]
}

export async function setDrawingHidden(id: string, hidden: boolean): Promise<void> {
  const { error } = await supabase.from("drawings").update({ hidden }).eq("id", id)
  if (error) throw error
}

export async function deleteDrawing(id: string): Promise<void> {
  const { error } = await supabase.from("drawings").delete().eq("id", id)
  if (error) throw error
}
