import { Command, Option, _channels_$_messages } from 'discord-hono'
import { match } from 'ts-pattern'
import { factory } from '../factory'
import { createBoardMessage } from '../repository/board'
import { getSchedules } from '../repository/schedule'
import { getTasks } from '../repository/task'
import { schedulesEmbed } from './schedule'
import { tasksEmbed } from './task'

const MESSAGES = {
  NO_GUILD_ID: '❎ サーバーIDが取得できませんでした。',
  NO_CHANNEL_ID: '❎ チャンネルIDが取得できませんでした。',
  NO_USER_ID: '❎ ユーザーIDが取得できませんでした。',

  GET_TASKS_FAILED: '❎ タスクの取得に失敗しました。',
  GET_SCHEDULES_FAILED: '❎ スケジュールの取得に失敗しました。',

  SEND_MESSAGE_FAILED: '❎ メッセージの送信に失敗しました。',
  BOARD_CREATED: '✅ ボードを作成しました。',
  BOARD_CREATE_FAILED: '❎ ボードの作成に失敗しました。',
}

type BoardCommandVariables = {
  type: 'task' | 'schedule'
}

export const boardCommand = factory.command<BoardCommandVariables>(
  new Command('board', 'タスクやスケジュールを表示するボードを作成します').options(
    new Option('type', 'ボードの種類 (task / schedule)', 'String')
      .choices({ value: 'task', name: 'タスク' }, { value: 'schedule', name: 'スケジュール' })
      .required(),
  ),
  (c) => {
    const guildId = c.interaction.guild_id
    const channelId = c.interaction.channel.id

    if (guildId === undefined) {
      return c.res({ content: MESSAGES.NO_GUILD_ID })
    }

    if (channelId === undefined) {
      return c.res({ content: MESSAGES.NO_CHANNEL_ID })
    }

    return match(c.var.type)
      .with('task', () =>
        c.resDefer(async (c) => {
          const tasksResult = await getTasks(c.env.DB, guildId)

          if (tasksResult.isErr()) {
            return c.ephemeral().followup(MESSAGES.GET_TASKS_FAILED)
          }

          try {
            const data = await c
              .rest('POST', _channels_$_messages, [channelId], {
                content: `タスク一覧 ${tasksResult.value.length}件`,
                embeds: [tasksEmbed(tasksResult.value).toJSON()],
              })
              .then((r) => r.json())

            const result = await createBoardMessage(c.env.DB, {
              guildId,
              channelId,
              messageId: data.id,
              type: 'task',
            })

            if (result.isErr()) {
              console.error(result.error)
              return c.ephemeral().followup(MESSAGES.BOARD_CREATE_FAILED)
            }

            return c.followupDelete()
          } catch (e) {
            console.error(e)
            return c.ephemeral().followup(MESSAGES.SEND_MESSAGE_FAILED)
          }
        }),
      )
      .with('schedule', () =>
        c.resDefer(async (c) => {
          const schedulesResult = await getSchedules(c.env.DB, guildId)

          if (schedulesResult.isErr()) {
            return c.ephemeral().followup(MESSAGES.GET_SCHEDULES_FAILED)
          }

          try {
            const data = await c
              .rest('POST', _channels_$_messages, [channelId], {
                content: `スケジュール一覧 ${schedulesResult.value.length}件`,
                embeds: [schedulesEmbed(schedulesResult.value).toJSON()],
              })
              .then((r) => r.json())

            const result = await createBoardMessage(c.env.DB, {
              guildId,
              channelId,
              messageId: data.id,
              type: 'schedule',
            })

            if (result.isErr()) {
              return c.ephemeral().followup(MESSAGES.BOARD_CREATE_FAILED)
            }

            return c.ephemeral().followupDelete()
          } catch (e) {
            console.error(e)
            return c.ephemeral().followup(MESSAGES.SEND_MESSAGE_FAILED)
          }
        }),
      )
      .exhaustive()
  },
)
