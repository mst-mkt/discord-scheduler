import type { D1Database } from '@cloudflare/workers-types'
import { createFactory } from 'discord-hono'

export interface Env {
  Bindings: {
    DB: D1Database
  }
}

export const factory = createFactory<Env>()
