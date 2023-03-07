import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Set the mod action log channel.',
        '#channel',
        '772957951941673000'
      ],
      {
        name: 'actionchannel',
        aliases: ['modlog', 'modlogs'],
        folder: 'Moderation',
        args: [1, 1],
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

    const channel = await getMentions(message, 'channels') ?? message.channel
    if (!isText(channel)) {
      return Embed.error('Channel isn\'t cached or the ID is incorrect.')
    }

    await sql`
      UPDATE kbGuild 
      SET mod_log_channel = ${channel.id}::text
      WHERE kbGuild.guild_id = ${message.guildId}::text;
    `

    return Embed.ok(`Set public mod-logging channel to ${channel}!`)
  }
}
