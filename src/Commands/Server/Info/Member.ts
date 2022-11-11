import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { formatPresence } from '#khaf/utility/util.js'
import { bold, italic, time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get info about a guild member.',
        '@Khafra#0001', '267774648622645249'
      ],
      {
        name: 'member',
        folder: 'Server',
        aliases: ['memberinfo', 'whois'],
        args: [0, 1],
        guildOnly: true
      }
    )
  }

  async init (message: Message<true>, { content }: Arguments): Promise<APIEmbed> {
    const member = await getMentions(message, 'members', content) ?? message.member

    if (!member) {
      return Embed.error('No guild member mentioned.')
    }

    // max role length = 84 characters
    return Embed.json({
      color: colors.ok,
      author: { name: member.displayName, icon_url: member.user.displayAvatarURL() },
      description: `${member} on ${italic(member.guild.name)}.
            ${formatPresence(member.presence?.activities)}
            
            Roles:
            ${[...member.roles.cache.filter(r => r.name !== '@everyone').values()].slice(0, 20).join(', ')}`,
      thumbnail: { url: member.user.displayAvatarURL() },
      fields: [
        { name: bold('Role Color:'), value: member.displayHexColor, inline: true },
        { name: bold('Joined Guild:'), value: time(member.joinedAt ?? new Date()), inline: false },
        {
          name: bold('Boosting Since:'),
          value: member.premiumSince ? time(member.premiumSince) : 'Not boosting',
          inline: true
        }
      ],
      footer: { text: 'For general user info use the user command!' }
    })
  }
}
