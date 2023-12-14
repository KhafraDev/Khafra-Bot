import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isDM, isExplicitText, isThread } from '#khaf/utility/Discord.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const channelTicketName = /^Ticket-[0-9a-f]{8}$/i
const memberPermsExpected = PermissionFlagsBits.ViewChannel
  | PermissionFlagsBits.SendMessages

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Archives or deletes a ticket!'
      ],
      {
        name: 'ticket:archive',
        folder: 'Server',
        aliases: ['tickets:archive', 'tickets:delete', 'tickets:delete'],
        args: [0, 0],
        ratelimit: 30,
        guildOnly: true
      }
    )
  }

  async init (message: Message<true>, _args: Arguments, settings: kGuild): Promise<undefined | APIEmbed> {
    if (settings.ticketchannel === null) {
      return Embed.error('Could not archive for you, the guild\'s ticket channel is unset.')
    } else if (!isDM(message.channel) && !channelTicketName.test(message.channel.name)) {
      return Embed.error('This is not a ticket channel.')
    }

    const everyoneId = message.guild.roles.everyone.id

    if (isThread(message.channel)) {
      if (message.channel.permissionsFor(everyoneId)?.has(PermissionFlagsBits.ViewChannel)) {
        return Embed.error(`${message.channel} is not private!`)
      }
    } else {
      const perms = message.channel.permissionOverwrites.cache

      if (!perms.has(message.author.id) || !perms.get(everyoneId)) {
        return Embed.error(`Incorrect permissions setup for ${message.channel}!`)
      } else {
        const memberPerms = perms.get(message.author.id)!
        const everyonePerms = perms.get(everyoneId)!

        if (!memberPerms.allow.has(memberPermsExpected)) {
          return Embed.error('You are missing some required permissions in this channel.')
        } else if (!everyonePerms.deny.has(PermissionFlagsBits.ViewChannel)) {
          return Embed.error('This channel is not private!')
        }
      }
    }

    const channel = message.guild.channels.cache.has(settings.ticketchannel)
      ? message.guild.channels.cache.get(settings.ticketchannel)
      : await message.guild.channels.fetch(settings.ticketchannel)

    if (isExplicitText(channel) && !isThread(message.channel)) {
      return Embed.error(`Expected thread, got ${message.channel.type}.`)
    } else if (isExplicitText(channel) && isThread(message.channel) && message.channel.manageable) {
      await message.channel.setArchived(true, `requested by ${message.author.id}`)
    } else if (message.channel.manageable) {
      await message.channel.delete()
    }

    return void await message.author.send({
      content: 'Ticket was archived/deleted.'
    }).catch(() => null)
  }
}
