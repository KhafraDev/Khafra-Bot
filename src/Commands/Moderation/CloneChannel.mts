import { Command } from '#khaf/Command'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isDM, isExplicitText, isStage, isText, isThread, isVoice } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { PermissionFlagsBits, type APIEmbed, type ComponentType } from 'discord-api-types/v10'
import type { GuildChannelCloneOptions, Message } from 'discord.js'
import { GuildChannel } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Delete a channel and clone it.',
        '#channel',
        '772957951941673000'
      ],
      {
        name: 'clonechannel',
        aliases: ['channelclone', 'clone'],
        folder: 'Moderation',
        args: [1, 1],
        guildOnly: true,
        ratelimit: 30,
        permissions: [
          PermissionFlagsBits.ManageChannels
        ]
      }
    )
  }

  async init (message: Message<true>): Promise<undefined | APIEmbed> {
    const channel = await getMentions(message, 'channels') ?? message.channel

    if (isThread(channel) || isDM(channel)) {
      return Embed.error(`I cannot clone a ${channel.type} channel!`)
    }

    const member = message.member ?? await message.guild.members.fetch({ user: message.author })

    if (!message.channel.permissionsFor(member).has(PermissionFlagsBits.SendMessages)) {
      return
    }

    const m = await message.reply({
      embeds: [
        Embed.ok(`
        Are you sure you want to clone ${channel}? The channel will be deleted and re-created; all pins will be lost.
        `)
      ],
      components: [
        Components.actionRow([
          Buttons.approve('Yes', 'approve'),
          Buttons.deny('No', 'deny')
        ])
      ]
    })

    {
      const i = await m.awaitMessageComponent<ComponentType.Button>({
        filter: (interaction) =>
          interaction.message.id === m.id &&
          ['approve', 'deny'].includes(interaction.customId) &&
          interaction.user.id === message.author.id,
        time: minutes(1)
      }).catch(() => null)

      if (i === null) {
        return Embed.error('No response, command was canceled!')
      } else if (i.customId === 'deny') {
        return Embed.error(`Command was canceled, ${channel} will not be cloned.`)
      }
    }

    const opts: GuildChannelCloneOptions = {
      name: channel.name,
      permissionOverwrites: channel.permissionOverwrites.cache,
      topic: 'topic' in channel ? channel.topic ?? undefined : undefined,
      type: channel.type,
      nsfw: isText(channel) ? channel.nsfw : undefined,
      parent: channel.parent,
      bitrate: isStage(channel) || isVoice(channel) ? channel.bitrate : undefined,
      userLimit: isStage(channel) || isVoice(channel) ? channel.userLimit : undefined,
      rateLimitPerUser: isExplicitText(channel) ? channel.rateLimitPerUser : undefined,
      position: channel.position
    }

    const clone = GuildChannel.prototype.clone.bind({
      ...opts,
      guild: message.guild,
      permissionOverwrites: channel.permissionOverwrites
    })

    if (!channel.deletable) {
      return Embed.error(`Sorry ${member}, I couldn't delete ${channel}.`)
    }

    await channel.delete()
    let cloned: GuildChannel

    try {
      cloned = await clone(opts)
    } catch {
      return void await message.author.send({
        embeds: [
          Embed.error(`Sorry ${member}, I couldn't recreate ${channel.name} after it was deleted.`)
        ]
      }).catch(() => null)
    }

    const embed = Embed.ok(`Cloned channel #${opts.name} -> ${cloned}!`)

    if (isText(cloned)) {
      return void await cloned.send({ embeds: [embed] })
    } else {
      return void await message.author.send({ embeds: [embed] }).catch(() => null)
    }
  }
}
