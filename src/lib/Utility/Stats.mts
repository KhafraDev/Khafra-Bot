import { Json } from '#khaf/utility/Constants/Path.mjs'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { seconds } from '#khaf/utility/ms.mjs'
import { writeFile } from 'node:fs/promises'
import { setInterval } from 'node:timers'

const path = Json('stats.json')
const config = createFileWatcher<typeof import('../../../assets/JSON/stats.json')>(path)

export const Stats = {
  messages: 0,
  session: 0,

  get stats (): typeof config {
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

      void writeFile(
        path,
        JSON.stringify(
          {
            globalCommandsUsed: globalCommandsUsed + Stats.session,
            globalMessages: globalMessages + Stats.messages
          } satisfies typeof config
        )
      )

      Stats.messages = 0
      Stats.session = 0
    }, seconds(60))
  })
}

Stats.write()
