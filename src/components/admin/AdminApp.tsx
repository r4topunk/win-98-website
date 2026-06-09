import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabase } from "../../lib/supabase"
import { AdminPanel } from "./AdminPanel"

type AuthState =
  | { kind: "loading" }
  | { kind: "anon" }
  | { kind: "signed-in"; email: string; isAdmin: boolean }

async function checkAdmin(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle()
  if (error) {
    console.warn("admin check error:", error.message)
    return false
  }
  return !!data
}

async function resolveAuthState(session: Session | null): Promise<AuthState> {
  if (!session?.user?.email) return { kind: "anon" }
  const isAdmin = await checkAdmin(session.user.email)
  return { kind: "signed-in", email: session.user.email, isAdmin }
}

export function AdminApp() {
  const [auth, setAuth] = useState<AuthState>(
    isSupabaseConfigured ? { kind: "loading" } : { kind: "anon" },
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe,
    // so we don't also call getSession() (avoids StrictMode double-mount lock).
    // Cache the last-resolved email to skip redundant `admins` SELECTs on
    // TOKEN_REFRESHED/USER_UPDATED events (Supabase auto-refreshes ~every 50min).
    let lastEmail: string | null = null
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextEmail = session?.user?.email ?? null
      if (nextEmail && nextEmail === lastEmail) return
      lastEmail = nextEmail
      const next = await resolveAuthState(session)
      setAuth(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="p-3 flex flex-col gap-2">
        <p className="font-bold">Admin unavailable</p>
        <p className="text-xs">
          Set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>{" "}
          to enable the admin panel.
        </p>
      </div>
    )
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setSignInError(null)
    setSigningIn(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setSigningIn(false)
    if (error) {
      // Don't reveal whether the email exists — same message for "no user"
      // and "wrong password".
      setSignInError("Invalid email or password.")
      setPassword("")
    }
    // On success, onAuthStateChange fires and re-renders into signed-in.
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (auth.kind === "loading") {
    return <div className="p-3"><p>Loading...</p></div>
  }

  if (auth.kind === "anon") {
    return (
      <div className="p-3 flex flex-col gap-2">
        <p className="font-bold">Admin login</p>
        <form onSubmit={signIn} className="flex flex-col gap-2">
          <div className="field-row-stacked">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field-row-stacked">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field-row">
            <button type="submit" disabled={signingIn || !email.trim() || !password}>
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        {signInError && <p className="text-xs">{signInError}</p>}
      </div>
    )
  }

  if (!auth.isAdmin) {
    return (
      <div className="p-3 flex flex-col gap-2">
        <p>Signed in as <b>{auth.email}</b></p>
        <p>This account is not authorized as admin.</p>
        <div className="field-row">
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  return <AdminPanel email={auth.email} onSignOut={signOut} />
}
