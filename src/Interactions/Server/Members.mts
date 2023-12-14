import { Interactions } from '#khaf/Interaction'
import { bold } from '@discordjs/builders'
import { type APIGuildPreview, type RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'members',
      description: 'Show the number of members currently in this server!'
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    if (!interaction.inGuild()) {
      return {
        content: 'Come on really? It\'s just you and me... (2)',
        ephemeral: true
      }
    }

    // The bot can fetch a guild preview even if the bot isn't in the server.
    const guild = interaction.guild
      ?? await interaction.client.guilds.fetch(interaction.guildId).catch(() => null)
      ?? await interaction.client.rest.get(Routes.guildPreview(interaction.guildId)) as APIGuildPreview

    const count = 'memberCount' in guild ? guild.memberCount : guild.approximate_member_count
    const note = 'memberCount' in guild ? '' : ' [Approximate]'

    return {
      content: `✅ There are ${bold(count.toLocaleString())}${note} members in ${guild.name}!`,
      ephemeral: true
    }
  }
}
