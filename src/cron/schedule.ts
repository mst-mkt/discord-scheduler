import type { APIEmbed } from 'discord-api-types/v10'
import { _channels_$_messages } from 'discord-hono'
import type { InferSelectModel } from 'drizzle-orm'
import type { schedules } from '../db/schema'
import { factory } from '../factory'
import { getTodaySchedules } from '../repository/schedule'

export const scheduleCron = factory.cron('', async (c) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const year = tomorrow.getFullYear().toString()
  const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0')
  const date = tomorrow.getDate().toString().padStart(2, '0')
  const dateString = `${year}/${month}/${date}`

  const result = await getTodaySchedules(c.env.DB, dateString)

  if (result.isErr()) {
    console.error(result.error)
    return
  }

  const grouped = Object.groupBy(result.value, (s) => s.channelId)

  for (const [channelId, schedules] of Object.entries(grouped)) {
    await c.rest('POST', _channels_$_messages, [channelId], {
      content: `本日 (${dateString}) の予定です`,
      embeds: schedules?.map(scheduleEmbed),
    })
  }
})

const scheduleEmbed = (schedule: InferSelectModel<typeof schedules>): APIEmbed => ({
  title: schedule.content,
  description: `${schedule.date} ${schedule.time ?? ''}`,
  fields: [
    { name: 'ID', value: schedule.id.toString() },
    { name: 'カテゴリ', value: schedule.category?.join(', ') ?? 'なし' },
  ],
})
