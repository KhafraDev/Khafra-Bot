import { client } from '#khaf/Client'
import { sql } from '#khaf/database/Postgres.mjs'
import { logger } from '#khaf/structures/Logger.mjs'
import { Timer } from '#khaf/Timer'
import type { kReminder } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { seconds } from '#khaf/utility/ms.mjs'
import { time } from '@discordjs/builders'

export class RemindersTimer extends Timer {
  constructor () {
    super({ interval: seconds(30) })
  }

  async setInterval (): Promise<void> {
    for await (const _ of this.yieldEvery()) {
      const rows = await sql<kReminder[]>`
        UPDATE "kbReminders" SET
          "time" = "time" + "kbReminders"."interval",
          "didEnd" = TRUE
        WHERE
          "time" < CURRENT_TIMESTAMP AND
          "didEnd" = FALSE
        RETURNING *
      `

      for (const row of rows) {
        void this.action(row)
      }
    }
  }

  async action (reminder: kReminder): Promise<void> {
    try {
      const user = await client.users.fetch(reminder.userId)

      const willRemind = reminder.once ? '' : `\n\nWill repeat at ${time(reminder.time)}!`
      const remind = Embed.json({
        color: colors.ok,
        description: `${reminder.message}${willRemind}`,
        author: { name: user.tag, icon_url: user.displayAvatarURL() }
      })

      await user.send({ embeds: [remind] })
    } catch (e) {
      logger.error(e, 'reminders error')
    } finally {
      logger.info({ reminder }, 'reminder')
    }
  }
}
