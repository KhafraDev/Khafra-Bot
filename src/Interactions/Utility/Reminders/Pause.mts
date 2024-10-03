import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'reminders',
    name: 'pause'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const id = interaction.options.getString('id', true)

    if (!uuidRegex.test(id)) {
      return {
        content: '❌ An invalid ID was provided!',
        ephemeral: true
      }
    }

    const rows = await sql<{ paused: boolean }[]>`
      UPDATE "kbReminders" SET
        "paused" = NOT "paused"
      WHERE
        "id" = ${id}::uuid AND
        "userId" = ${interaction.user.id}::text
      RETURNING "paused";
    `

    if (rows.count === 0) {
      return {
        content: '❌ You do not have any reminders with that ID.',
        ephemeral: true
      }
    }

    const action = rows[0].paused ? 'Paused' : 'Unpaused'

    return {
      content: `✅ ${action} a reminder for you!`,
      ephemeral: true
    }
  }
}
