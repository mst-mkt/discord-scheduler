import { commands } from './commands'
import { components } from './components'
import { scheduleCron } from './cron/schedule'
import { factory } from './factory'

// biome-ignore lint/style/noDefaultExport: this file is entry point
export default factory.discord().loader([...commands, ...components, scheduleCron])
