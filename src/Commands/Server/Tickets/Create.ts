import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isExplicitText } from '#khaf/utility/Discord.js'
import {
  ChannelType,
  GuildPremiumTier,
  OverwriteType,
  PermissionFlagsBits,
  ThreadAutoArchiveDuration,
  type APIEmbed
} from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Create a ticket!',
        'This is the reason that the ticket is being created'
      ],
      {
        name: 'ticket:create',
        folder: 'Server',
        aliases: ['tickets:create'],
        args: [0],
        ratelimit: 30,
        guildOnly: true
      }
    )
  }

  async init (message: Message<true>, { args, commandName }: Arguments, settings: kGuild): Promise<APIEmbed> {
    if (settings.ticketchannel === null) {
      return Embed.error('This guild doesn\'t have a ticket channel! Ask a moderator to use `ticketchanel [channel]`!')
    } else if (commandName === 'ticket' || commandName === 'tickets') {
      args.shift()
    }

    /** guild can use private threads */
    const privateThreads =
      message.guild.premiumTier !== GuildPremiumTier.None &&
      message.guild.premiumTier !== GuildPremiumTier.Tier1

    const channel = message.guild.channels.cache.has(settings.ticketchannel)
      ? message.guild.channels.cache.get(settings.ticketchannel)
      : await message.guild.channels.fetch(settings.ticketchannel)

    if (isExplicitText(channel) && !privateThreads) {
      return Embed.error(
        'This guild is no longer tier 2 or above, and cannot use private threads. ' +
        'Use the `ticketchannel` command to re-set the ticket channel!'
      )
    }

    assert(channel?.type === ChannelType.GuildText || channel?.type === ChannelType.GuildCategory)

    const uuid = randomUUID()
    const name = `Ticket-${uuid.slice(0, uuid.indexOf('-'))}`
    const me = message.guild.members.me ?? await message.guild.members.fetchMe()

    if (isExplicitText(channel)) {
      if (!channel.permissionsFor(me).has(PermissionFlagsBits.CreatePrivateThreads)) {
        return Embed.json({
          color: colors.error,
          description: `Sorry ${message.member ?? message.author}, I can't create a thread.`
        })
      }

      const thread = await channel.threads.create({
        type: ChannelType.PrivateThread,
        name: name,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        reason: `${message.author.tag} (${message.author.id}) created a support ticket.`
      })

      // https://discord.com/developers/docs/resources/channel#add-thread-member
      // "Requires the ability to send messages in the thread"
      if (thread.permissionsFor(me).has(PermissionFlagsBits.SendMessages)) {
        await thread.members.add(message.author)
        await thread.send(`${message.author}: ${args.join(' ')}`)
      }

      return Embed.ok(`Successfully created a ticket: ${thread}!`)
    } else {
      if (!message.channel.permissionsFor(me).has(PermissionFlagsBits.ManageChannels)) {
        return Embed.json({
          color: colors.error,
          description: `Sorry ${message.member ?? message.author}, I can't create a channel.`
        })
      }

      // create normal text channel with permissions for message.author
      const ticketChannel = await message.guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: channel,
        permissionOverwrites: [
          {
            type: OverwriteType.Role,
            id: message.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            type: OverwriteType.Member,
            id: message.author.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ]
      })

      await ticketChannel.send({ content: `${message.author}: ${args.join(' ')}` })

      return Embed.ok(`Successfully created a ticket: ${ticketChannel}!`)
    }
  }
}
