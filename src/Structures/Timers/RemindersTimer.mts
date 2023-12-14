import { time } from '@discordjs/builders'
import type { Client } from 'discord.js'
import { Timer } from '#khaf/Timer'
import { sql } from '#khaf/database/Postgres.mjs'
import { logger } from '#khaf/structures/Logger.mjs'
import type { kReminder } from '#khaf/types/KhafraBot.js'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { seconds } from '#khaf/utility/ms.mjs'

export class RemindersTimer extends Timer {
  constructor(client: Client) {
    super({ interval: seconds(30), client })
  }

  async setInterval(): Promise<void> {
    for await (const _ of this.yieldEvery()) {
      // We only want to set didEnd when the reminder is not set to repeat.
      // But we also want to select all reminders that haven't ended.
      // If time + interval < current_timestamp, set time to
      // current_timestamp + interval. Otherwise the user will get reminders
      // whenever this runs. This can happen when the bot is offline.
      const rows = await sql<kReminder[]>`
        UPDATE "kbReminders" SET
          "time" = CASE WHEN "time" + "kbReminders"."interval" < CURRENT_TIMESTAMP
            THEN CURRENT_TIMESTAMP + "kbReminders"."interval"
            ELSE "time" + "kbReminders"."interval"
          END,
          "didEnd" = CASE WHEN "once" = TRUE THEN TRUE ELSE FALSE END
        WHERE
          "time" < CURRENT_TIMESTAMP AND
          "didEnd" = FALSE AND
          "paused" = FALSE
        RETURNING *
      `

      for (const row of rows) {
        void this.action(row)
      }
    }
  }

  async action(reminder: kReminder): Promise<void> {
    try {
      const user = await this.options.client.users.fetch(reminder.userId)

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
