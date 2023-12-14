import { hyperlink, inlineCode } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { KhafraClient } from '#khaf/Bot'
import { InteractionSubCommand } from '#khaf/Interaction'
import { sql } from '#khaf/database/Postgres.mjs'
import type { Giveaway } from '#khaf/types/KhafraBot.js'

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand extends InteractionSubCommand {
  constructor() {
    super({
      references: 'giveaway',
      name: 'end'
    })
  }

  async handle(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    if (!interaction.inGuild()) {
      return {
        content: '❌ Unable to use the command.',
        ephemeral: true
      }
    }

    const idOrText = interaction.options.getString('giveaway-id-or-prize', true)
    const where = uuidRegex.test(idOrText)
      ? sql`kbGiveaways.id = ${idOrText}::uuid`
      : sql`kbGiveaways.prize LIKE ${`%${idOrText}%`}`

    const [giveaway] = await sql<[Giveaway?]>`
      WITH giveaway AS (
        SELECT kbGiveaways.id FROM kbGiveaways
        WHERE
          ${where} AND
          kbGiveaways.guildid = ${interaction.guildId}::text AND
          kbGiveaways.initiator = ${interaction.user.id}::text AND
          kbGiveaways."didEnd" = FALSE
        LIMIT 1
      )

      UPDATE kbGiveaways SET
        "didEnd" = TRUE
      FROM giveaway
      WHERE kbGiveaways.id = giveaway.id
      RETURNING *;
    `

    if (!giveaway) {
      return {
        content: '❌ No giveaway could be found.',
        ephemeral: true
      }
    }

    const { channelid, guildid, messageid, id } = giveaway

    const timer = KhafraClient.Timers.get('GiveawayTimer')!
    await timer.action(giveaway) // run giveaway

    const url = `https://discord.com/channels/${guildid}/${channelid}/${messageid}`

    return {
      content: `✅ Giveaway ${inlineCode(id)} has ended! Check out the winners ${hyperlink('here', url)}!`,
      ephemeral: true
    }
  }
}
