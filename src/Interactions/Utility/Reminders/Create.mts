import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import { minutes, parseStrToMs } from '#khaf/utility/ms.mjs'
import { ellipsis } from '#khaf/utility/String.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { inlineCode, time as formatTime } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'reminders',
      name: 'create'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const text = interaction.options.getString('message', true)
    const time = interaction.options.getString('time', true)
    const once = !interaction.options.getBoolean('repeat')
    const interval = interaction.options.getString('interval')

    const parsedTime = parseStrToMs(time)
    const parsedInterval = interval ? parseStrToMs(interval) : parsedTime

    if (parsedTime < minutes(1)) {
      return {
        content: '❌ The shortest reminder you can set is 1 minute.',
        ephemeral: true
      }
    } else if (parsedInterval < minutes(1)) {
      return {
        content: '❌ The shortest interval is 1 minute.',
        ephemeral: true
      }
    }

    const date = new Date(Date.now() + parsedTime)
    const rows = await sql<{ id: string }[]>`
      INSERT INTO "kbReminders" (
        "userId", "message", "time", "once", "interval"
      ) VALUES (
        ${interaction.user.id}::text,
        ${text},
        ${date}::timestamp,
        ${once}::boolean,
        ${parsedInterval || parsedTime} * '1 millisecond'::interval
      ) RETURNING id;
    `

    const intervalMessage = once ? '' : ` (Interval ${formatTime(Math.floor(parsedTime / 1000), 'R')})`

    return {
      content: stripIndents`
      ✅ Set a reminder for you!

      • Message: ${inlineCode(ellipsis(text, 100))}
      • Time: ${formatTime(date)}${intervalMessage}
      • ID: ${inlineCode(rows[0].id)}
      • Repeat: ${!once ? 'Yes' : 'No'}
      `,
      ephemeral: true
    }
  }
}
