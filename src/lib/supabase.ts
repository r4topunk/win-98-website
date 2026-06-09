import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { sampleGalleries } from "../data/galleries"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

// In dev without env vars we render the admin in "demo mode" so the layout
// is inspectable. Public site builds without env vars stay safely degraded
// (sample galleries + no admin), so this flag is dev-only.
export const isAdminDevPreview = !isSupabaseConfigured && import.meta.env.DEV

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing — " +
      "gallery data will use bundled sampleGalleries; /admin renders in dev preview mode (no persistence)."
  )
}

// Typed stub so consumers can import `supabase` without null checks at compile
// time. Any actual call throws a clear runtime error in PROD; in DEV we route
// to a demo stub that returns sample data so AdminPanel renders.
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

// Dev preview stub: returns sample galleries / images so the AdminPanel
// renders meaningfully without a backend. Writes silently no-op.
function devPreviewStub(): SupabaseClient {
  const galleriesRows = Object.entries(sampleGalleries).map(([id, g], i) => ({
    id,
    name: (g as { name: string }).name,
    description: null,
    sort_order: i,
    created_at: "",
    updated_at: "",
  }))
  const imagesRows: Array<Record<string, unknown>> = []
  for (const [galleryId, g] of Object.entries(sampleGalleries)) {
    const imgs = (g as unknown as { images: Array<{ src: string; alt: string; title?: string; link?: string }> }).images
    imgs.forEach((img, i) => {
      imagesRows.push({
        id: `${galleryId}-${i}`,
        gallery_id: galleryId,
        storage_path: img.src ?? "",
        alt: img.alt ?? "",
        title: img.title ?? null,
        link: img.link ?? null,
        sort_order: i,
        width: null,
        height: null,
        created_at: "",
        updated_at: "",
      })
    })
  }
  const tables: Record<string, Array<Record<string, unknown>>> = {
    galleries: galleriesRows,
    images: imagesRows,
    admins: [{ email: "dev@local" }],
  }

  function makeQuery(table: string) {
    const filters: Record<string, unknown> = {}
    const apply = () => {
      let rows = (tables[table] ?? []).slice()
      for (const [col, val] of Object.entries(filters)) {
        rows = rows.filter((r) => r[col] === val)
      }
      return { data: rows, error: null }
    }
    const proxy: unknown = new Proxy(() => {}, {
      get(_t, prop) {
        if (prop === "then") {
          // Make the builder awaitable like supabase-js returns.
          return (resolve: (v: unknown) => void) => resolve(apply())
        }
        if (prop === "eq") {
          return (col: string, val: unknown) => {
            filters[col] = val
            return proxy
          }
        }
        if (prop === "maybeSingle" || prop === "single") {
          return () => Promise.resolve({ data: apply().data[0] ?? null, error: null })
        }
        if (prop === "insert" || prop === "update" || prop === "delete") {
          return () => proxy
        }
        // .select() / .order() / fallback — keep chaining
        return () => proxy
      },
    })
    return proxy
  }

  return {
    from(table: string) {
      return makeQuery(table)
    },
    storage: {
      from() {
        return {
          upload: async () => ({ error: null }),
          remove: async () => ({ error: null }),
          getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
        }
      },
    },
    auth: {
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithOtp: async () => ({ error: null }),
      signOut: async () => undefined,
      getSession: async () => ({ data: { session: null } }),
    },
  } as unknown as SupabaseClient
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
  : isAdminDevPreview
    ? devPreviewStub()
    : unconfiguredStub()

export const STORAGE_BUCKET = "site-images"

export function publicImageUrl(storagePath: string): string {
  if (!isSupabaseConfigured) return storagePath
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data
    .publicUrl
}
