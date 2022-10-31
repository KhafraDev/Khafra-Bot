import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { hasPerms } from '#khaf/utility/Permissions.js'
import { bold } from '@discordjs/builders'
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
        'Disables @everyone from sending messages.',
        '#general',
        '543940496683434014',
        ''
      ],
      {
        name: 'lock',
        folder: 'Moderation',
        args: [0, 1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.ManageChannels]
      }
    )
  }

  async init (message: Message<true>, _args: Arguments, settings: kGuild): Promise<undefined | APIEmbed> {
    const text = await getMentions(message, 'channels') ?? message.channel
    const everyone = message.guild.roles.everyone

    if (!isText(text)) {
      return Embed.error('This command only works in text & news channels.')
    } else if (!hasPerms(text, message.guild.members.me, this.permissions)) {
      if (message.guild.members.me) {
        return Embed.perms(text, message.guild.members.me, this.permissions)
      } else {
        return Embed.error('A caching issue prevented me from properly checking permissions!')
      }
    }

    let lockState = 'unlocked'
    if (!hasPerms(text, everyone, PermissionFlagsBits.SendMessages)) {
      await text.lockPermissions()
    } else {
      lockState = 'locked'
      await text.permissionOverwrites.set(
        [{ id: everyone.id, deny: [PermissionFlagsBits.SendMessages] }]
      )
    }

    await message.reply({
      embeds: [
        Embed.ok(`${text} has been ${lockState} for ${everyone}!`)
      ]
    })

    if (settings.mod_log_channel !== null) {
      const channel = message.guild.channels.cache.get(settings.mod_log_channel)

      if (!isText(channel) || !hasPerms(channel, message.guild.members.me, perms))
        return

      return void channel.send({
        embeds: [
          Embed.json({
            color: colors.ok,
            description: `
                        ${bold('Channel:')} ${text} (${text.id}).
                        ${bold('Staff:')} ${message.member}`,
            title: 'Channel Locked'
          })
        ]
      })
    }
  }
}
