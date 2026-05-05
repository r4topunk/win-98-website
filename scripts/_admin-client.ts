// Server-side Supabase client. Uses the SECRET key — NEVER import from src/.
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const url = process.env.VITE_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local"
  )
}

export const adminClient = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const STORAGE_BUCKET = "site-images"
