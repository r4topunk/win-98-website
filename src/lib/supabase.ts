import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local"
  )
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // No-op lock avoids supabase-js v2 deadlock under React.StrictMode dev
    // double-mount. Safe for single-tab admin usage.
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
})

export const STORAGE_BUCKET = "site-images"

export function publicImageUrl(storagePath: string): string {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data
    .publicUrl
}
