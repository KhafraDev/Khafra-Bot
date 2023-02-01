import { Json } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { once } from '#khaf/utility/Memoize.js'
import { writeFile } from 'node:fs/promises'
import { setInterval } from 'node:timers'

const path = Json('stats.json')
const config = createFileWatcher<typeof import('../../../assets/JSON/stats.json')>(path)

export const Stats = {
  messages: 0,
  session: 0,

  get stats(): typeof config {
    return {
      globalCommandsUsed: config.globalCommandsUsed + Stats.session,
      globalMessages: config.globalMessages + Stats.messages
    }
  },

  write: once(() => {
    setInterval(() => {
      const {
        globalCommandsUsed,
        globalMessages
      } = Stats.stats

      void writeFile(path, JSON.stringify({
        globalCommandsUsed: globalCommandsUsed + Stats.session,
        globalMessages: globalMessages + Stats.messages
      } as typeof config))

      Stats.messages = 0
      Stats.session = 0
    }, 60 * 1000)
  })
}

Stats.write()
