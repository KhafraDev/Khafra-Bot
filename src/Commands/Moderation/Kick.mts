import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import { hierarchy } from '#khaf/utility/Permissions.mjs'
import { bold } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Kick a member from the server.',
        '@user for trolling',
        '1234567891234567'
      ],
      {
        name: 'kick',
        folder: 'Moderation',
        args: [1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.KickMembers]
      }
    )
  }

  async init (message: Message<true>, { args, content }: Arguments, settings: kGuild): Promise<undefined | APIEmbed> {
    const member = await getMentions(message, 'members', content)

    if (!hierarchy(message.member, member)) {
      return Embed.error(`You cannot kick ${member}!`)
    }

    if (!member) {
      return Embed.error('No member was mentioned and/or an invalid ❄️ was used!')
    } else if (!member.kickable) {
      return Embed.error(`${member} is too high up in the hierarchy for me to kick.`)
    }

    await member.kick(`Khafra-Bot: req. by ${message.author.tag} (${message.author.id}).`)

    await message.reply({ embeds: [Embed.error(`Kicked ${member} from the server!`)] })

    if (settings.mod_log_channel !== null) {
      const channel = message.guild.channels.cache.get(settings.mod_log_channel)
      const me = message.guild.members.me ?? await message.guild.members.fetchMe()

      if (!isText(channel) || !channel.permissionsFor(me).has(perms))
        return

      const reason = args.slice(1).join(' ')
      return void channel.send({
        embeds: [
          Embed.json({
            color: colors.ok,
            description: `
              ${bold('Offender:')} ${member}
              ${bold('Reason:')} ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
              ${bold('Staff:')} ${message.member}`,
            title: 'Member Kicked'
          })
        ]
      })
    }
  }
}
