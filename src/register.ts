import { Command, register } from 'discord-hono'
import { commands } from './commands'

const commandsInfo = commands.map((c) => {
  return new Command(c.name, c.description)
})

register(
  commandsInfo,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
  process.env.DISCORD_TEST_GUILD_ID,
)
