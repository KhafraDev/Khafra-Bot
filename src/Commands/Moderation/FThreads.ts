import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isCategory, isStage, isThread, isVoice } from '#khaf/utility/Discord.js'
import { minutes } from '#khaf/utility/ms.js'
import { bold, inlineCode, italic } from '@discordjs/builders'
import { PermissionFlagsBits, type APIEmbed, type ComponentType } from 'discord-api-types/v10'
import type { GuildChannel, Message, NonThreadGuildBasedChannel } from 'discord.js'

const threadPerms =
  PermissionFlagsBits.ManageThreads |
  PermissionFlagsBits.CreatePublicThreads |
  PermissionFlagsBits.CreatePrivateThreads |
  PermissionFlagsBits.SendMessagesInThreads

export class kCommand extends Command {
  constructor () {
    super(
      [
        `By default, Discord threads are allowed to be created by ${italic('anyone')}. ` +
        'This command disables all 3 default permissions.'
      ],
      {
        name: 'fthreads',
        aliases: ['fthread', 'fuckthread', 'fuckthreads'],
        folder: 'Moderation',
        args: [0],
        guildOnly: true,
        ratelimit: 1,
        permissions: [
          PermissionFlagsBits.ManageChannels
        ]
      }
    )
  }

  async init (message: Message<true>): Promise<undefined | APIEmbed> {
    const m = await message.reply({
      embeds: [
        Embed.ok(`
        Are you sure you want to disable these permissions for everyone? This cannot be reverted by the bot!
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
          ['approve', 'deny'].includes(interaction.customId) &&
          interaction.user.id === message.author.id &&
          interaction.message.id === m.id,
        time: minutes(1)
      }).catch(() => null)

      if (i === null) {
        return Embed.error('No response, command was canceled!')
      } else if (i.customId === 'deny') {
        return Embed.error('Command was canceled, permissions will not be disabled!')
      } else {
        await i.update({ components: disableAll(m) })
      }
    }

    const allChannels = await message.guild.channels.fetch()

    const channels = allChannels.filter((c): c is NonThreadGuildBasedChannel =>
      c !== null && !isStage(c) && !isThread(c) && !isVoice(c) && !c.permissionsLocked
    )

    const pr: Promise<GuildChannel>[] = []
    const member = message.member ?? await message.guild.members.fetch({ user: message.author })
    const me = message.guild.members.me ?? await message.guild.members.fetchMe()

    for (const channel of channels.values()) {
      const overwrites = channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id)
      const denied = overwrites?.deny.has(threadPerms)

      if (!denied) {
        if (!channel.permissionsFor(me).has(PermissionFlagsBits.ManageChannels)) continue
        if (!channel.permissionsFor(member).has(PermissionFlagsBits.ManageChannels)) continue

        pr.push(channel.permissionOverwrites.edit(
          message.guild.roles.everyone,
          {
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
            ManageThreads: false
          }
        ))
      }
    }

    if (pr.length === 0) {
      return Embed.ok('No channel permissions needed to be updated!')
    }

    const settled = await Promise.allSettled(pr)
    const success = settled.filter((p): p is PromiseFulfilledResult<GuildChannel> => p.status === 'fulfilled')
    const rejected = settled.filter((p): p is PromiseRejectedResult => p.status === 'rejected')

    let description = ''
    if (success.length > 0)
      description += `${bold('Success:')}\n`

    while (success.length !== 0 && description.length < maxDescriptionLength) {
      const { value } = success.shift()!
      const line = isCategory(value)
        ? `Category ${inlineCode(value.name)}\n`
        : `${value}\n`
      if (description.length + line.length > maxDescriptionLength) break

      description += line
    }

    if (rejected.length > 0 && description.length + `\n\n${bold('Rejected!')}\n`.length <= maxDescriptionLength)
      description += `\n${bold('Rejected!')}\n`

    while (rejected.length !== 0 && description.length < maxDescriptionLength) {
      const { reason } = rejected.shift()! as { reason: Error }
      const line = `${inlineCode(reason.message)}\n`
      if (description.length + line.length > maxDescriptionLength) break
      description += line
    }

    return Embed.json({
      color: colors.ok,
      title: `Edited ${success.length} Channel Perms!`,
      author: {
        name: message.guild.name,
        icon_url: message.guild.bannerURL() ?? undefined
      },
      description
    })
  }
}
