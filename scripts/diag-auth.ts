// Diagnose auth state: who's in auth.users + admins, and Supabase auth settings.
// Run: pnpm tsx scripts/diag-auth.ts

import postgres from "postgres"
import { config } from "dotenv"
config({ path: ".env.local" })

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error("missing DATABASE_URL")

async function main() {
  const sql = postgres(dbUrl!, { ssl: "require", max: 1 })
  const users = await sql`
    select id, email, created_at, last_sign_in_at, email_confirmed_at
    from auth.users
    order by created_at desc
    limit 10
  `
  console.log("auth.users (last 10):")
  console.table(
    users.map((u) => ({
      email: u.email,
      created: u.created_at,
      last_sign_in: u.last_sign_in_at,
      confirmed: u.email_confirmed_at,
    }))
  )

  const admins = await sql`select email, created_at from public.admins`
  console.log("\npublic.admins:")
  console.table(admins)

  // Sample audit log entries to see if magic link send was attempted
  const logs = await sql`
    select created_at, payload->>'action' as action, payload->>'actor_username' as actor
    from auth.audit_log_entries
    order by created_at desc
    limit 10
  `
  console.log("\nauth.audit_log_entries (last 10):")
  console.table(logs)

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
