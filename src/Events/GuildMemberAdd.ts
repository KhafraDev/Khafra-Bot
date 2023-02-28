import { sql } from '#khaf/database/Postgres.js'
import type { Event } from '#khaf/Event'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { guildSettings } from '#khaf/utility/util.js'
import { time } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { Events, type GuildMember } from 'discord.js'

const basic =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildMemberAdd as const

  async init (member: GuildMember): Promise<void> {
    await sql`
      INSERT INTO kbInsights (
          k_guild_id, k_joined
      ) VALUES (
          ${member.guild.id}::text, ${1}::integer
      ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
          k_joined = kbInsights.k_joined + 1
          WHERE kbInsights.k_guild_id = ${member.guild.id}::text;
    `

    const item = await guildSettings(member.guild.id, ['welcome_channel'])

    if (!item?.welcome_channel) {
      return
    }

    const channel = await member.guild.channels.fetch(item.welcome_channel)
    const me = member.guild.members.me

    if (
      channel === null ||
      me === null ||
      !isTextBased(channel) ||
      !channel.permissionsFor(me).has(basic)
    ) {
      return
    }

    const embed = Embed.json({
      color: colors.ok,
      author: { name: member.user.username, icon_url: member.user.displayAvatarURL() },
      description: `
        ${member} (${member.user.tag}) joined the server!
        • Account Created: ${time(member.user.createdAt)} (${time(member.user.createdAt, 'R')})
        • Joined: ${time(member.joinedAt!)} (${time(member.joinedAt!, 'R')})`,
      footer: { text: 'User joined' }
    })

    await channel.send({ embeds: [embed] })
  }
}
