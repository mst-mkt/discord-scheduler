import type { D1Database } from '@cloudflare/workers-types'
import { type CommandContext, _channels_$_messages_$ } from 'discord-hono'
import { err, ok } from 'neverthrow'
import { schedulesEmbed } from '../commands/schedule'
import { tasksEmbed } from '../commands/task'
import { getBoardMessages } from '../repository/board'
import { getSchedules } from '../repository/schedule'
import { getTasks } from '../repository/task'

export const updateTaskBoard = async (
  db: D1Database,
  guildId: string,
  rest: CommandContext['rest'],
) => {
  const boardsResult = await getBoardMessages(db, guildId, 'task')

  if (boardsResult.isErr()) {
    return err(boardsResult.error)
  }

  if (boardsResult.value.length === 0) {
    return ok(null)
  }

  const tasksResult = await getTasks(db, guildId)

  if (tasksResult.isErr()) {
    return err(tasksResult.error)
  }

  await Promise.all(
    boardsResult.value.map(async (board) => {
      await rest('PATCH', _channels_$_messages_$, [board.channelId, board.messageId], {
        content: `タスク一覧 ${tasksResult.value.length}件`,
        embeds: [tasksEmbed(tasksResult.value).toJSON()],
      }).catch((e) => {
        console.error(e)
      })
    }),
  )

  return ok(null)
}

export const updateScheduleBoard = async (
  db: D1Database,
  guildId: string,
  rest: CommandContext['rest'],
) => {
  const boardsResult = await getBoardMessages(db, guildId, 'schedule')

  if (boardsResult.isErr()) {
    return err(boardsResult.error)
  }

  if (boardsResult.value.length === 0) {
    return ok(null)
  }

  const schedulesResult = await getSchedules(db, guildId)

  if (schedulesResult.isErr()) {
    return err(schedulesResult.error)
  }

  await Promise.all(
    boardsResult.value.map(async (board) => {
      await rest('PATCH', _channels_$_messages_$, [board.channelId, board.messageId], {
        content: `スケジュール一覧 ${schedulesResult.value.length}件`,
        embeds: [schedulesEmbed(schedulesResult.value).toJSON()],
      }).catch((e) => {
        console.error(e)
      })
    }),
  )
}
