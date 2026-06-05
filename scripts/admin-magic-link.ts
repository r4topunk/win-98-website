// Generate a magic-link URL for an admin email and print it.
// Bypasses SMTP — paste the printed URL into your browser to log in.
//
// Usage: pnpm tsx scripts/admin-magic-link.ts <email>

import { adminClient } from "./_admin-client"

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error("usage: pnpm tsx scripts/admin-magic-link.ts <email>")
    process.exit(1)
  }

  const redirectTo = process.env.ADMIN_REDIRECT_TO ?? "http://localhost:5173/admin"

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  })

  if (error) {
    console.error("FAIL:", error.message)
    process.exit(1)
  }

  const link = data.properties?.action_link
  console.log("\nEmail:    ", email)
  console.log("Redirect: ", redirectTo)
  console.log("\nMagic link (paste in browser):\n")
  console.log(link)
  console.log("")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
