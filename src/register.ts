import { register } from 'discord-hono'
import { commands } from './commands'

register(
  commands.map((c) => c.command),
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
  process.env.DISCORD_TEST_GUILD_ID,
)
