import { commands } from './commands'
import { deleteScheduleComponent } from './components/delete-schedule'
import { scheduleCron } from './cron/schedule'
import { factory } from './factory'

// biome-ignore lint/style/noDefaultExport: this file is entry point
export default factory.discord().loader([...commands, scheduleCron, deleteScheduleComponent])
