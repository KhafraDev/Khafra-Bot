import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { inlineCode } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const schema = s.number.greaterThanOrEqual(0).lessThanOrEqual(32767)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Set the amount of warning points it requires before a member is kicked. Max = 32,767.',
        '100',
        '20',
        '32767'
      ],
      {
        name: 'warnlimit',
        aliases: ['limit', 'setwarn'],
        folder: 'Moderation',
        args: [1, 1],
        guildOnly: true
      }
    )
  }

  async init (message: Message<true>, { args }: Arguments): Promise<APIEmbed> {
    const newAmount = Number(args[0]!)
    const member = message.member ?? await message.guild.members.fetch({ user: message.author })

    if (!message.channel.permissionsFor(member).has(PermissionFlagsBits.Administrator)) {
      return Embed.perms(
        message.channel,
        message.member,
        PermissionFlagsBits.Administrator
      )
    } else if (!schema.is(newAmount)) {
      return Embed.error('An invalid number of points was provided, try with a positive whole number instead!')
    }

    await sql`
      UPDATE kbGuild
      SET max_warning_points = ${newAmount}::smallint
      WHERE guild_id = ${message.guildId}::text;
    `

    return Embed.ok(`Set the max warning points limit to ${inlineCode(newAmount.toLocaleString())}!`)
  }
}
