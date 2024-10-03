import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Giveaway } from '#khaf/types/KhafraBot.js'
import { inlineCode } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

type GiveawayRow = Pick<Giveaway, 'messageid' | 'channelid' | 'id'>

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'giveaway',
    name: 'delete'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const id = interaction.options.getString('id', true)

    if (!uuidRegex.test(id)) {
      return {
        content: '❌ That id is invalid, try again!',
        ephemeral: true
      }
    } else if (!interaction.inGuild()) {
      return {
        content: '❌ No guild id provided in the command, re-invite the bot with the correct permissions.',
        ephemeral: true
      }
    }

    const rows = await sql<GiveawayRow[]>`
      DELETE FROM kbGiveaways
      WHERE
          kbGiveaways.guildId = ${interaction.guildId}::text AND
          kbGiveaways.id = ${id}::uuid AND
          kbGiveaways.initiator = ${interaction.user.id}::text
      RETURNING messageId, channelId, id;
    `

    if (rows.length === 0) {
      return {
        content: '❌ No giveaway with that ID exists.',
        ephemeral: true
      }
    }

    const [{ channelid, messageid, id: uuid }] = rows
    const channel = await interaction.guild?.channels.fetch(channelid)

    if (channel?.type !== ChannelType.GuildText) {
      return {
        content: '❌ Channel has been deleted or I do not have permission to see it.',
        ephemeral: true
      }
    }

    const giveawayMessage = await channel.messages.fetch(messageid)

    if (!giveawayMessage.deletable) {
      return {
        content: '✅ The giveaway has been stopped, but I could not delete the giveaway message!',
        ephemeral: true
      }
    }

    await giveawayMessage.delete()

    return {
      content: `✅ Giveaway ${inlineCode(uuid)} has been deleted!`,
      ephemeral: true
    }
  }
}
