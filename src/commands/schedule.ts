import { Command, Embed, Option, SubCommand } from 'discord-hono'
import type { InferSelectModel } from 'drizzle-orm'
import { match } from 'ts-pattern'
import type { schedules } from '../db/schema'
import { factory } from '../factory'
import { createSchedule, deleteSchedule, getSchedules } from '../repository/schedule'
import { validateDate, validateTime } from '../utils/datetime'

const MESSAGES = {
  NO_GUILD_ID: '❎ サーバーIDが取得できませんでした。',
  NO_CHANNEL_ID: '❎ チャンネルIDが取得できませんでした。',
  NO_USER_ID: '❎ ユーザーIDが取得できませんでした。',

  SCHEDULE_CREATED: '✅ スケジュールを作成しました。',
  SCHEDULE_CREATE_FAILED: '❎ スケジュールの作成に失敗しました。',

  SCHEDULE_LIST: '📋 スケジュール一覧',
  SCHEDULE_EMPTY: '📋 スケジュールはありません。',
  SCHEDULE_LIST_FAILED: '❎ スケジュールの取得に失敗しました。',

  SCHEDULE_DELETED: '✅ スケジュールを削除しました。',
  SCHEDULE_DELETE_FAILED: '❎ スケジュールの削除に失敗しました.',
}

type CreateScheduleVariables = {
  subcommand: 'create'
  content: string
  category?: string
  date: string
  time?: string
}

type ListScheduleVariables = {
  subcommand: 'list'
}

type DeleteScheduleVariables = {
  subcommand: 'delete'
  id: number
}

type ScheduleCommandVariables =
  | CreateScheduleVariables
  | ListScheduleVariables
  | DeleteScheduleVariables

export const scheduleCommand = factory.command<ScheduleCommandVariables>(
  new Command('schedule', 'スケジュールを管理します').options(
    new SubCommand('create', '新しいスケジュールを作成します').options(
      new Option('content', 'スケジュールの内容', 'String').min_length(1).required(),
      new Option('date', 'スケジュールの日付 (00/00)', 'String').required(),
      new Option('time', 'スケジュールの時間 (00:00)', 'String'),
      new Option('category', 'スケジュールのカテゴリ (カンマ区切り)', 'String'),
    ),
    new SubCommand('list', 'スケジュールの一覧を表示します'),
    new SubCommand('delete', 'スケジュールを削除します').options(
      new Option('id', 'スケジュールのID', 'Integer').required(),
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

    const options = { ...c.var, subcommand: c.sub.command } as ScheduleCommandVariables

    return match(options)
      .with({ subcommand: 'create' }, ({ content, category, date, time }) => {
        const dateResult = validateDate(date)
        const timeResult = validateTime(time)

        if (dateResult.isErr()) {
          return c.res({ content: dateResult.error })
        }

        if (timeResult.isErr()) {
          return c.res({ content: timeResult.error })
        }

        return c.resDefer(async (c) => {
          const result = await createSchedule(c.env.DB, {
            guildId,
            userId,
            channelId,
            content,
            category: category?.split(',').map((v) => v.trim()) ?? [],
            date: dateResult.value,
            time: timeResult.value,
          })

          if (result.isErr()) {
            return c.followup({ content: MESSAGES.SCHEDULE_CREATE_FAILED })
          }

          return c.followup({
            content: `${MESSAGES.SCHEDULE_CREATED}\nID: \`${result.value.id}\`, TITLE: \`${result.value.content}\`, DATE: \`${result.value.date}\`, TIME: \`${result.value.time}\``,
          })
        })
      })
      .with({ subcommand: 'list' }, () =>
        c.resDefer(async (c) => {
          const result = await getSchedules(c.env.DB, guildId)

          if (result.isErr()) {
            return c.followup({ content: MESSAGES.SCHEDULE_LIST_FAILED })
          }

          if (result.value.length === 0) {
            return c.followup({ content: MESSAGES.SCHEDULE_EMPTY })
          }

          return c.followup({
            embeds: [schedulesEmbed(result.value)],
          })
        }),
      )
      .with({ subcommand: 'delete' }, ({ id }) =>
        c.resDefer(async (c) => {
          const result = await deleteSchedule(c.env.DB, guildId, id)

          if (result.isErr()) {
            return c.followup({ content: MESSAGES.SCHEDULE_DELETE_FAILED })
          }

          return c.followup({
            content: `${MESSAGES.SCHEDULE_DELETED}\nID: \`${result.value.id}\`, TITLE: \`${result.value.content}\``,
          })
        }),
      )
      .exhaustive()
  },
)

const schedulesEmbed = (schedule: InferSelectModel<typeof schedules>[]) => {
  return new Embed()
    .title(MESSAGES.SCHEDULE_LIST)
    .description(`全 ${schedule.length} 件`)
    .fields(
      ...schedule
        .slice(0, 25)
        .reverse()
        .map((schedule) => ({
          name: `${schedule.date}${schedule.time === null ? '' : ` ${schedule.time}`} | ${schedule.content}`,
          value: `-# \`${schedule.id}\` ${schedule.category?.length === 0 ? '' : `| ${schedule.category?.join(', ')}`}`,
        })),
    )
    .footer({
      text: schedule.length > 25 ? `残り ${schedule.length - 25} 件` : '',
    })
}
