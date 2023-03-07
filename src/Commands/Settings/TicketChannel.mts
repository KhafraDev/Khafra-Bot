import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isCategory, isExplicitText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import { GuildPremiumTier, PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Select a channel to create private ticket threads on (if the server has enough boosts), ' +
                'or a category channel to create ticket channels in.',
        '866022233330810930 [channel id]',
        '#general [channel mention]'
      ],
      {
        name: 'ticketchannel',
        folder: 'Settings',
        aliases: ['ticketchannels'],
        args: [1, 1],
        ratelimit: 10,
        guildOnly: true
      }
    )
  }

  async init (message: Message<true>): Promise<APIEmbed> {
    const member = message.member ?? await message.guild.members.fetch({ user: message.author })

    if (!message.channel.permissionsFor(member).has(PermissionFlagsBits.Administrator)) {
      return Embed.perms(
        message.channel,
        message.member,
        PermissionFlagsBits.Administrator
      )
    }

    /** guild can use private threads */
    const privateThreads =
      message.guild.premiumTier !== GuildPremiumTier.None &&
      message.guild.premiumTier !== GuildPremiumTier.Tier1

    const ticketChannel = await getMentions(message, 'channels')

    if (!isExplicitText(ticketChannel) && !isCategory(ticketChannel)) {
      return Embed.error(`${ticketChannel ?? 'None'} is not a text or category channel!`)
    } else if (isExplicitText(ticketChannel) && !privateThreads) {
      return Embed.error('This guild cannot use private threads, please use a category channel instead!')
    }

    await sql`
      UPDATE kbGuild
      SET ticketChannel = ${ticketChannel.id}::text
      WHERE guild_id = ${message.guildId}::text;
    `

    return Embed.ok(`Changed the default ticket channel to ${ticketChannel}!`)
  }
}
