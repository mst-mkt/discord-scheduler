import { Command, Embed, Option, SubCommand } from 'discord-hono'
import type { InferSelectModel } from 'drizzle-orm'
import { match } from 'ts-pattern'
import type { tasks } from '../db/schema'
import { factory } from '../factory'
import { createTask, getTasks } from '../repository/task'

const MESSAGES = {
  NO_GUILD_ID: '❎ サーバーIDが取得できませんでした。',
  NO_CHANNEL_ID: '❎ チャンネルIDが取得できませんでした。',
  NO_USER_ID: '❎ ユーザーIDが取得できませんでした。',

  TASK_CREATED: '✅ タスクを作成しました。',
  TASK_CREATE_FAILED: '❎ タスクの作成に失敗しました。',

  TASK_LIST: '📋 タスク一覧',
  TASK_EMPTY: '📋 タスクはありません。',
  TASK_LIST_FAILED: '❎ タスクの取得に失敗しました。',
}

type CreateTaskVariables = {
  subcommand: 'create'
  content: string
  category?: string
}

type ListTaskVariables = {
  subcommand: 'list'
  status?: 'all' | 'incomplete'
}

type TaskCommandVariables = CreateTaskVariables | ListTaskVariables

export const taskCommand = factory.command<TaskCommandVariables>(
  new Command('task', 'manage tasks').options(
    new SubCommand('create', '新しいタスクを作成します').options(
      new Option('content', 'タスクの内容', 'String').min_length(1).required(),
      new Option('category', 'タスクのカテゴリ (カンマ区切り)', 'String'),
    ),
    new SubCommand('list', 'タスクの一覧を表示します').options(
      new Option('status', 'タスクのステータス', 'String').choices(
        { name: 'all', value: 'all' },
        { name: 'incomplete', value: 'incomplete' },
      ),
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

    const options = { ...c.var, subcommand: c.sub.command } as TaskCommandVariables

    return match(options)
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
            return c.followup({ content: MESSAGES.TASK_CREATE_FAILED })
          }

          return c.followup({ content: MESSAGES.TASK_CREATED })
        }),
      )
      .with({ subcommand: 'list' }, ({ status }) =>
        c.resDefer(async (c) => {
          const result = await getTasks(c.env.DB, guildId, status)

          if (result.isErr()) {
            return c.followup({ content: MESSAGES.TASK_CREATE_FAILED })
          }

          if (result.value.length === 0) {
            return c.followup({ content: MESSAGES.TASK_EMPTY })
          }

          return c.followup({
            embeds: [tasksEmbed(result.value)],
          })
        }),
      )
      .exhaustive()
  },
)

const tasksEmbed = (task: InferSelectModel<typeof tasks>[]) => {
  return new Embed()
    .title(MESSAGES.TASK_LIST)
    .description(`全 ${task.length} 件`)
    .fields(
      ...task.slice(0, 25).map((task) => ({
        name: `${task.completedAt === null ? '⏳' : '✅'} ${task.content}`,
        value: `-# \`${task.id}\` | ${task.createdAt?.toLocaleDateString('ja-JP')} ${task.category?.length === 0 ? '' : `| ${task.category?.join(', ')}`}`,
      })),
    )
    .footer({
      text: task.length > 25 ? `残り ${task.length - 25} 件` : '',
    })
}
