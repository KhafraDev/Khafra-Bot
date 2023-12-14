import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.mjs'

const basic = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks

export class kCommand extends Command {
  constructor() {
    super(
      [
        'Set the welcome channel for messages when a user leaves, joins, or is kicked from the guild!',
        '#general',
        '705896428287033375'
      ],
      {
        name: 'welcome',
        folder: 'Settings',
        args: [1, 1],
        guildOnly: true,
        aliases: ['welcomechannel']
      }
    )
  }

  async init(message: Message<true>): Promise<APIEmbed> {
    const member = message.member ?? (await message.guild.members.fetch({ user: message.author }))

    if (!message.channel.permissionsFor(member).has(PermissionFlagsBits.Administrator)) {
      return Embed.perms(message.channel, message.member, PermissionFlagsBits.Administrator)
    }

    const channel = await getMentions(message, 'channels')
    const me = message.guild.members.me ?? (await message.guild.members.fetchMe())

    if (!isText(channel)) {
      return Embed.error(`${channel} is not a text channel!`)
    } else if (!channel.permissionsFor(me).has(basic)) {
      return Embed.perms(channel, me, basic)
    }

    await sql`
      UPDATE kbGuild
      SET welcome_channel = ${channel.id}::text
      WHERE guild_id = ${message.guildId}::text;
    `

    return Embed.ok(`
    You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
    `)
  }
}
