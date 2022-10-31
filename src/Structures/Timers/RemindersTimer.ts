import { client } from '#khaf/Client'
import { sql } from '#khaf/database/Postgres.js'
import { logger } from '#khaf/structures/Logger.js'
import { Timer } from '#khaf/Timer'
import type { kReminder } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { time } from '@discordjs/builders'

export class RemindersTimer extends Timer {
  constructor () {
    super({ interval: 30 * 1000 })
  }

  async setInterval (): Promise<void> {
    for await (const _ of this.yieldEvery(this.options.interval)) {
      const rows = await sql<kReminder[]>`
        WITH deleted AS (
            DELETE FROM "kbReminders"
            WHERE 
              "time" < CURRENT_TIMESTAMP AND
              "once" = TRUE
            RETURNING *
        ), updated AS (
            UPDATE "kbReminders"
            SET "time" = "time" + "kbReminders"."interval"
            WHERE
              "time" < CURRENT_TIMESTAMP AND
              "once" = FALSE
            RETURNING *
        )
    
        SELECT * FROM deleted
    
        UNION ALL
    
        SELECT * FROM updated;
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
