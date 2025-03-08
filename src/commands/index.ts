import type { CommandContext } from 'discord-hono'
import type { Env } from '..'

export type Command = {
  name: string
  description: string
  handler: (c: CommandContext<Env>) => Response | Promise<Response>
}

export const commands: Command[] = []
