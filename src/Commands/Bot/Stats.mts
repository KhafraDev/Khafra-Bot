import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { Stats } from '#khaf/utility/Stats.mjs'
import { bold } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super([
      'Get global stats for the bot!'
    ], {
      name: 'stats',
      folder: 'Bot',
      args: [0, 0],
      ratelimit: 1
    })
  }

  init (message: Message): APIEmbed {
    const guilds = message.client.guilds.cache
    const {
      globalCommandsUsed,
      globalMessages
    } = Stats.stats

    const totalMembers = guilds.map((g) => g.memberCount)
      .reduce((a, b) => a + b, 0)
      .toLocaleString()
    const totalGuilds = guilds.size.toLocaleString()

    return Embed.json({
      color: colors.ok,
      title: 'Bot Statistics',
      fields: [
        { name: bold('Guilds:'), value: totalGuilds, inline: true },
        { name: bold('Members:'), value: totalMembers, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: bold('Total Messages:'), value: globalMessages.toLocaleString(), inline: true },
        { name: bold('Total Commands:'), value: globalCommandsUsed.toLocaleString(), inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      ]
    })
  }
}
