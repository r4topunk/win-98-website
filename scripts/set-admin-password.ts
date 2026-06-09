// Create or update an admin's password.
// - If the auth user doesn't exist yet, creates it (email_confirm=true so no
//   confirmation email is sent).
// - If it exists, updates the password in place.
// Does NOT touch public.admins — that allowlist is managed separately and
// is hard-capped at 2 rows by a DB trigger.
//
// Usage:
//   pnpm tsx scripts/set-admin-password.ts <email> <password>

import { adminClient } from "./_admin-client"

async function findUserByEmail(email: string) {
  // listUsers paginates; we iterate until we find the email or run out.
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  if (!email || !password) {
    console.error("usage: pnpm tsx scripts/set-admin-password.ts <email> <password>")
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("FAIL: password must be at least 8 characters")
    process.exit(1)
  }

  const existing = await findUserByEmail(email)

  if (existing) {
    const { error } = await adminClient.auth.admin.updateUserById(existing.id, { password })
    if (error) { console.error("FAIL:", error.message); process.exit(1) }
    console.log(`✓ password updated for existing user ${email} (id=${existing.id})`)
    return
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // mark as verified so no confirmation email is sent
  })
  if (error) { console.error("FAIL:", error.message); process.exit(1) }
  console.log(`✓ created auth user ${email} (id=${data.user?.id}) with password set`)
  console.log("  reminder: insert this email into public.admins if not already there")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
