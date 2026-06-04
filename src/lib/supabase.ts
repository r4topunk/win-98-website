import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing — " +
      "gallery data will use bundled sampleGalleries; /admin will be unavailable."
  )
}

// Typed stub so consumers can import `supabase` without null checks at compile
// time. Any actual call throws a clear runtime error; GalleriesProvider checks
// isSupabaseConfigured first and never hits it in offline mode.
function unconfiguredStub(): SupabaseClient {
  const message =
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local."
  const handler: ProxyHandler<object> = {
    get() {
      throw new Error(message)
    },
  }
  return new Proxy({}, handler) as unknown as SupabaseClient
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // No-op lock avoids supabase-js v2 deadlock under React.StrictMode dev
        // double-mount. Safe for single-tab admin usage.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    })
  : unconfiguredStub()

export const STORAGE_BUCKET = "site-images"

export function publicImageUrl(storagePath: string): string {
  if (!isSupabaseConfigured) return storagePath
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data
    .publicUrl
}
