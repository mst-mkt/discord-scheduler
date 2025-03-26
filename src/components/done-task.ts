import { Button } from 'discord-hono'
import { factory } from '../factory'
import { completeTask } from '../repository/task'

export const doneTaskComponent = factory.component(
  new Button('task_complete', '', 'Primary'),
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
      const result = await completeTask(c.env.DB, guildId, id)

      if (result.isErr()) {
        console.error('completeTask error', result.error)
        return c.ephemeral().followup({ content: '❎ タスクの完了に失敗しました。' })
      }

      return c.followup('✅ タスクを完了しました。')
    })
  },
)
