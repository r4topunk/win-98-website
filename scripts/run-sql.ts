// Run an arbitrary .sql file against DATABASE_URL.
// Usage: pnpm tsx scripts/run-sql.ts <path>

import { promises as fs } from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { config } from "dotenv"
config({ path: ".env.local" })

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error("Missing DATABASE_URL in .env.local")

const target = process.argv[2]
if (!target) throw new Error("Usage: tsx scripts/run-sql.ts <file.sql>")

async function main() {
  const file = path.resolve(process.cwd(), target)
  const sql = await fs.readFile(file, "utf8")
  const client = postgres(dbUrl!, { ssl: "require", max: 1 })
  console.log(`Running ${file} ...`)
  await client.unsafe(sql)
  console.log("OK")
  await client.end()
}

main().catch(async (e) => {
  console.error("FAIL:", e.message)
  process.exit(1)
})
