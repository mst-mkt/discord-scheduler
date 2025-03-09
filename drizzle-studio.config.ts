import { Config } from "drizzle-kit"
import { readdirSync } from "node:fs"

const localDbUrl = (() => {
  const dir = "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/"
  const files = readdirSync(dir)
  const dbFile = files.find(file => file.endsWith(".sqlite"))

  if (dbFile === undefined) {
    throw new Error("No database file found")
  }

  return `${dir}${dbFile}`
})()

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: localDbUrl,
  }
} satisfies Config
