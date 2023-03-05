import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import { days, parseStrToMs } from '#khaf/utility/ms.mjs'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const schema = s.number.int.greaterThanOrEqual(0).lessThanOrEqual(7)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Softban a member (bans and instantly unbans them; clearing recent messages).',
        '@user for a good reason',
        '@user bye!',
        '239566240987742220'
      ],
      {
        name: 'softban',
        folder: 'Moderation',
        aliases: ['softbna'],
        args: [1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.BanMembers]
      }
    )
  }

  async init (message: Message<true>, { args, content }: Arguments): Promise<APIEmbed> {
    const member = await getMentions(message, 'users', content)
    if (!member) {
      return Embed.error('No user mentioned and/or an invalid ❄️ was used!')
    }

    const clear = typeof args[1] === 'string'
      ? Math.ceil(parseStrToMs(args[1])! / 86400000)
      : 7
    const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ')

    try {
      await message.guild.members.ban(member, {
        deleteMessageSeconds: schema.is(clear) ? clear * days(0.001) : days(0.007),
        reason
      })
      await message.guild.members.unban(member, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`)
    } catch {
      return Embed.error(`${member} isn't bannable!`)
    }

    return Embed.ok(`${member} has been soft-banned from the guild!`)
  }
}
