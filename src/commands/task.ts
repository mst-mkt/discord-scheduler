import { Command, Option, SubCommand } from 'discord-hono'
import { match } from 'ts-pattern'
import { factory } from '../factory'
import { createTask } from '../repository/task'

const MESSAGES = {
  NO_GUILD_ID: '❎ サーバーIDが取得できませんでした。',
  NO_CHANNEL_ID: '❎ チャンネルIDが取得できませんでした。',
  NO_USER_ID: '❎ ユーザーIDが取得できませんでした。',

  TASK_CREATED: '✅ タスクを作成しました。',
  TASK_FAILED: '❎ タスクの作成に失敗しました。',
}

type CreateTaskVariables = {
  subcommand: 'create'
  content: string
  category?: string
}

type TaskCommandVariables = CreateTaskVariables

export const taskCommand = factory.command<TaskCommandVariables>(
  new Command('task', 'manage tasks').options(
    new SubCommand('create', '新しいタスクを作成します').options(
      new Option('content', 'タスクの内容', 'String').min_length(1).required(),
      new Option('category', 'タスクのカテゴリ (カンマ区切り)', 'String'),
    ),
  ),
  (c) => {
    const guildId = c.interaction.guild_id
    const channelId = c.interaction.channel.id
    const userId = c.interaction.member?.user.id

    if (guildId === undefined) {
      return c.res({ content: MESSAGES.NO_GUILD_ID })
    }

    if (channelId === undefined) {
      return c.res({ content: MESSAGES.NO_CHANNEL_ID })
    }

    if (userId === undefined) {
      return c.res({ content: MESSAGES.NO_USER_ID })
    }

    return match(c.var)
      .with({ subcommand: 'create' }, ({ content, category }) =>
        c.resDefer(async (c) => {
          const result = await createTask(c.env.DB, {
            guildId,
            channelId,
            userId,
            content,
            category: category?.split(',').map((c) => c.trim()) ?? [],
          })

          if (result.isErr()) {
            return c.followup({ content: MESSAGES.TASK_FAILED })
          }

          return c.followup({ content: MESSAGES.TASK_CREATED })
        }),
      )
      .exhaustive()
  },
)
