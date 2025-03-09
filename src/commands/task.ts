import { Command, Option } from 'discord-hono'
import { factory } from '../factory'
import { createTask } from '../repository/task'

const MESSAGES = {
  NO_GUILD_ID: '❎ サーバーIDが取得できませんでした。',
  NO_CHANNEL_ID: '❎ チャンネルIDが取得できませんでした。',
  NO_USER_ID: '❎ ユーザーIDが取得できませんでした。',

  TASK_CREATED: '✅ タスクを作成しました。',
  TASK_FAILED: '❎ タスクの作成に失敗しました。',
}

export const taskCommand = factory.command<{ content: string }>(
  new Command('task', 'manage tasks').options(
    new Option('content', 'タスクの内容', 'String').min_length(1),
  ),
  (c) => {
    const guildId = c.interaction.guild_id
    const channelId = c.interaction.channel.id
    const userId = c.interaction.member?.user.id
    const content = c.var.content

    if (guildId === undefined) {
      return c.res({ content: MESSAGES.NO_GUILD_ID })
    }

    if (channelId === undefined) {
      return c.res({ content: MESSAGES.NO_CHANNEL_ID })
    }

    if (userId === undefined) {
      return c.res({ content: MESSAGES.NO_USER_ID })
    }

    return c.resDefer(async (c) => {
      const result = await createTask(c.env.DB, {
        guildId,
        channelId,
        userId,
        content,
      })

      if (result.isErr()) {
        return c.followup({ content: MESSAGES.TASK_FAILED })
      }

      return c.followup({ content: MESSAGES.TASK_CREATED })
    })
  },
)
