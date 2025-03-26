import { Command, Components, Embed, Option, SubCommand } from 'discord-hono'
import type { InferSelectModel } from 'drizzle-orm'
import { match } from 'ts-pattern'
import { deleteTaskComponent } from '../components/delete-task'
import { doneTaskComponent } from '../components/done-task'
import type { tasks } from '../db/schema'
import { factory } from '../factory'
import { completeTask, createTask, deleteTask, getTasks } from '../repository/task'

const MESSAGES = {
  NO_GUILD_ID: '❎ サーバーIDが取得できませんでした。',
  NO_CHANNEL_ID: '❎ チャンネルIDが取得できませんでした。',
  NO_USER_ID: '❎ ユーザーIDが取得できませんでした。',

  TASK_CREATED: '✅ タスクを作成しました。',
  TASK_CREATE_FAILED: '❎ タスクの作成に失敗しました。',

  TASK_LIST: '📋 タスク一覧',
  TASK_EMPTY: '📋 タスクはありません。',
  TASK_LIST_FAILED: '❎ タスクの取得に失敗しました。',

  TASK_DELETED: '✅ タスクを削除しました。',
  TASK_DELETE_FAILED: '❎ タスクの削除に失敗しました。',

  TASK_COMPLETED: '✅ タスクを完了しました。',
  TASK_COMPLETE_FAILED: '❎ タスクの完了に失敗しました。',
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

type DeleteTaskVariables = {
  subcommand: 'delete'
  id: string
}

type DoneTaskVariables = {
  subcommand: 'done'
  id: string
}

type TaskCommandVariables =
  | CreateTaskVariables
  | ListTaskVariables
  | DeleteTaskVariables
  | DoneTaskVariables

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
    new SubCommand('delete', 'タスクを削除します').options(
      new Option('id', 'タスクのID (カンマ区切り)', 'String').required(),
    ),
    new SubCommand('done', 'タスクを完了にします').options(
      new Option('id', 'タスクのID (カンマ区切り)', 'String').required(),
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

          return c.followup({
            content: `${MESSAGES.TASK_CREATED}\nID: \`${result.value.id}\`, TITLE: \`${result.value.content}\``,
            components: new Components().row(
              doneTaskComponent.component
                .emoji('✅')
                .label('完了')
                .custom_id(result.value.id.toString())
                .toJSON(),
              deleteTaskComponent.component
                .emoji('🗑')
                .label('削除')
                .custom_id(result.value.id.toString())
                .toJSON(),
            ),
          })
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
      .with({ subcommand: 'delete' }, ({ id }) =>
        c.resDefer(async (c) => {
          const ids = id
            .split(',')
            .map((id) => Number.parseInt(id.trim()))
            .filter((id) => !Number.isNaN(id))

          const results = await Promise.all(ids.map((id) => deleteTask(c.env.DB, guildId, id)))

          const message = results
            .map((result) =>
              match(result)
                .when(
                  (r) => r.isOk(),
                  () => MESSAGES.TASK_DELETED,
                )
                .when(
                  (r) => r.isErr(),
                  () => MESSAGES.TASK_DELETE_FAILED,
                )
                .otherwise(() => ''),
            )
            .join('\n')

          return c.followup({ content: message })
        }),
      )
      .with({ subcommand: 'done' }, ({ id }) =>
        c.resDefer(async (c) => {
          const ids = id
            .split(',')
            .map((id) => Number.parseInt(id.trim()))
            .filter((id) => !Number.isNaN(id))

          const results = await Promise.all(ids.map((id) => completeTask(c.env.DB, guildId, id)))

          const message = results
            .map((result) =>
              match(result)
                .when(
                  (r) => r.isOk(),
                  () => MESSAGES.TASK_COMPLETED,
                )
                .when(
                  (r) => r.isErr(),
                  () => MESSAGES.TASK_COMPLETE_FAILED,
                )
                .otherwise(() => ''),
            )
            .join('\n')

          return c.followup({ content: message })
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
      ...task
        .slice(0, 25)
        .reverse()
        .map((task) => ({
          name: `${task.completedAt === null ? '⏳' : '✅'} ${task.content}`,
          value: `-# \`${task.id}\` | ${task.createdAt?.toLocaleDateString('ja-JP')} ${task.category?.length === 0 ? '' : `| ${task.category?.join(', ')}`}`,
        })),
    )
    .footer({
      text: task.length > 25 ? `残り ${task.length - 25} 件` : '',
    })
}
