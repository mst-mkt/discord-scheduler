import { Button } from 'discord-hono'
import { factory } from '../factory'
import { deleteTask } from '../repository/task'

export const deleteTaskComponent = factory.component(
  new Button('task_delete', '', 'Danger'),
  (c) => {
    const guildId = c.interaction.guild_id

    if (guildId === undefined) {
      return c.ephemeral().res({ content: '❎ サーバーIDが取得できませんでした。' })
    }
    const id = Number.parseInt(c.var.custom_id ?? '', 10)

    if (Number.isNaN(id)) {
      return c.ephemeral().res({ content: '❎ タスクIDが取得できませんでした。' })
    }

    return c.resDeferUpdate(async (c) => {
      const result = await deleteTask(c.env.DB, guildId, id)

      if (result.isErr()) {
        console.error('deleteTask error', result.error)
        return c.ephemeral().followup({ content: '❎ タスクの削除に失敗しました。' })
      }

      return c.followupDelete()
    })
  },
)
