import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import { minutes, parseStrToMs } from '#khaf/utility/ms.mjs'
import { ellipsis } from '#khaf/utility/String.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { formatMs } from '#khaf/utility/util.mjs'
import { inlineCode, time as formatTime } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'reminders',
      name: 'edit'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const id = interaction.options.getString('id', true)

    if (!uuidRegex.test(id)) {
      return {
        content: '❌ An invalid ID was provided!',
        ephemeral: true
      }
    }

    const text = interaction.options.getString('message')
    const time = interaction.options.getString('time')
    const once = interaction.options.getBoolean('repeat')
    const interval = interaction.options.getString('interval')

    const parsedTime = time ? parseStrToMs(time) : null
    const parsedInterval = interval ? parseStrToMs(interval) : parsedTime

    if (parsedTime && parsedTime < minutes(1)) {
      return {
        content: '❌ The shortest reminder you can set is 1 minute.',
        ephemeral: true
      }
    } else if (parsedInterval && parsedInterval < minutes(1)) {
      return {
        content: '❌ The shortest interval is 1 minute.',
        ephemeral: true
      }
    }

    const date = parsedTime ? new Date(Date.now() + parsedTime) : null
    const sqlInterval = parsedInterval ?? parsedTime

    const rows = await sql<{ id: string }[]>`
      UPDATE "kbReminders" SET
        "message" = COALESCE(NULLIF(${text}::text, NULL), "kbReminders"."message"),
        "time" = COALESCE(NULLIF(${date}::timestamp, NULL), "kbReminders"."time"),
        "once" = COALESCE(NULLIF(${typeof once === 'boolean' ? !once : null}::boolean, NULL), "kbReminders"."once"),
        "interval" = COALESCE(
          NULLIF(${sqlInterval}, NULL)::bigint * '1 millisecond'::interval,
          "kbReminders"."interval"
        ),
        "didEnd" = FALSE
      WHERE
        "id" = ${id}::uuid AND
        "userId" = ${interaction.user.id}::text
      ;
    `

    if (rows.count === 0) {
      return {
        content: '❌ You do not have any reminders with that ID.',
        ephemeral: true
      }
    }

    const updatedFields: string[] = []

    if (text) updatedFields.push(`• Message: ${inlineCode(ellipsis(text, 100))}`)
    if (date) updatedFields.push(`• Time: ${formatTime(date)}`)
    if (once !== null) updatedFields.push(`• Repeat: ${once}`)
    if (sqlInterval) updatedFields.push(`• Interval: ${formatMs(sqlInterval)}`)

    return {
      content: stripIndents`
      ✅ Edited a reminder for you!

      ID: ${inlineCode(id)}
      ${updatedFields.join('\n')}
      `,
      ephemeral: true
    }
  }
}
