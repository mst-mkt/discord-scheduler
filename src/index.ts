import type { D1Database } from '@cloudflare/workers-types'
import { DiscordHono } from 'discord-hono'
import { commands } from './commands'

export interface Env {
  Bindings: {
    DB: D1Database
  }
}

const app = commands.reduce((acc, c) => {
  return acc.command(c.name, c.handler)
}, new DiscordHono<Env>())

// biome-ignore lint/style/noDefaultExport: this file is entry point
export default app
