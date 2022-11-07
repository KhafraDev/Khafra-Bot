import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isText } from '#khaf/utility/Discord.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js'
import { bold, inlineCode } from '@discordjs/builders'
import type { APIEmbed} from 'discord-api-types/v10'
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

    const [kickError] = await dontThrow(member.kick(`Khafra-Bot: req. by ${message.author.tag} (${message.author.id}).`))

    if (kickError !== null) {
      return Embed.error(`An unexpected error occurred: ${inlineCode(kickError.message)}`)
    }

    await message.reply({ embeds: [Embed.error(`Kicked ${member} from the server!`)] })

    if (settings.mod_log_channel !== null) {
      const channel = message.guild.channels.cache.get(settings.mod_log_channel)

      if (!isText(channel) || !hasPerms(channel, message.guild.members.me, perms))
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
