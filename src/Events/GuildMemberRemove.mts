import { join } from 'node:path'
import { time } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { Events, type GuildMember } from 'discord.js'
import type { Event } from '#khaf/Event'
import { sql } from '#khaf/database/Postgres.mjs'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { isTextBased } from '#khaf/utility/Discord.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { guildSettings } from '#khaf/utility/util.mjs'

const config = createFileWatcher<typeof import('../../config.json')>(join(cwd, 'config.json'))

const basic = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildMemberRemove as const

  async init(member: GuildMember): Promise<void> {
    if (member.id === config.botId) {
      return
    }

    await sql`
      INSERT INTO kbInsights (
          k_guild_id, k_left
      ) VALUES (
          ${member.guild.id}::text, ${1}::integer
      ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
          k_left = kbInsights.k_left + 1
          WHERE kbInsights.k_guild_id = ${member.guild.id}::text;
    `

    const item = await guildSettings(member.guild.id, ['welcome_channel'])

    if (!item?.welcome_channel) {
      return
    }

    const channel = await member.guild.channels.fetch(item.welcome_channel)
    const me = member.guild.members.me

    if (channel === null || me === null || !isTextBased(channel) || !channel.permissionsFor(me).has(basic)) {
      return
    }

    const joined =
      (member.joinedAt ? time(member.joinedAt) : 'N/A') + ` (${member.joinedAt ? time(member.joinedAt, 'R') : 'N/A'})`

    const embed = Embed.json({
      color: colors.ok,
      author: { name: member.user.username, icon_url: member.user.displayAvatarURL() },
      description: `
        ${member} (${member.user.tag}) has left the server!
        • Account Created: ${time(member.user.createdAt)} (${time(member.user.createdAt, 'R')})
        • Joined: ${joined}
        • Left: ${time(new Date())} (${time(new Date(), 'R')})`,
      footer: { text: 'User left' }
    })

    await channel.send({ embeds: [embed] })
  }
}
