import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'

export const createDbClient = (db: D1Database) => {
  return drizzle(db)
}
