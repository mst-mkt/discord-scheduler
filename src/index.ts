import { commands } from './commands'
import { factory } from './factory'

// biome-ignore lint/style/noDefaultExport: this file is entry point
export default factory.discord().loader(commands)
