import { Button } from 'discord-hono'
import { factory } from '../factory'
import { deleteSchedule } from '../repository/schedule'

export const deleteScheduleComponent = factory.component(
  new Button('schedule_delete', '', 'Danger'),
  (c) => {
    const guildId = c.interaction.guild_id

    if (guildId === undefined) {
      return c.ephemeral().res({ content: '❎ サーバーIDが取得できませんでした。' })
    }
    const id = Number.parseInt(c.var.custom_id ?? '', 10)

    if (Number.isNaN(id)) {
      return c.ephemeral().res({ content: '❎ スケジュールIDが取得できませんでした。' })
    }

    return c.resDeferUpdate(async (c) => {
      const result = await deleteSchedule(c.env.DB, guildId, id)

      if (result.isErr()) {
        console.error('deleteSchedule error', result.error)
        return c.ephemeral().followup({ content: '❎ スケジュールの削除に失敗しました。' })
      }

      return c.followupDelete()
    })
  },
)
