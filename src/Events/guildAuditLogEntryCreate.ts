import { sql } from '#khaf/database/Postgres.js'
import type { Event } from '#khaf/Event'
import type { Case } from '#khaf/functions/case/reports'
import type { kGuild } from '#khaf/types/KhafraBot'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { upperCase } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { bold } from '@discordjs/builders'
import { AuditLogEvent, PermissionFlagsBits } from 'discord-api-types/v10'
import { Events, type Guild, type GuildAuditLogsEntry } from 'discord.js'
import assert from 'node:assert'

const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildAuditLogEntryCreate as const

  async init (entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
    if (entry.action === AuditLogEvent.MemberKick) {
      return await this.kicked(entry, guild)
    } else if (
      entry.action === AuditLogEvent.MemberBanAdd ||
      entry.action === AuditLogEvent.MemberBanRemove
    ) {
      return await this.banUnban(entry, guild)
    }
  }

  async kicked (entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
    assert(entry.targetId && entry.executorId)

    const _case = {
      type: 'kick',
      targetId: entry.targetId,
      reason: entry.reason ?? '',
      staffId: entry.executorId,
      guildId: guild.id
    } satisfies Case

    await sql`
      INSERT INTO "kbCases"
      ${sql(_case as Record<string, unknown>, ...Object.keys(_case))}
    `

    const [item] = await sql<[Pick<kGuild, 'mod_log_channel'>?]>`
      SELECT mod_log_channel FROM kbGuild
      WHERE guild_id = ${guild.id}::text
      LIMIT 1;
    `

    if (!item?.mod_log_channel) {
      return
    }

    const channel = await guild.channels.fetch(item.mod_log_channel)
    const me = await guild.members.fetchMe()

    if (
      channel === null ||
      !isGuildTextBased(channel) ||
      !channel.permissionsFor(me).has(perms)
    ) {
      return
    }

    const staff = await guild.members.fetch(entry.executorId)
    const targetUser = await guild.client.users.fetch(entry.targetId)

    await channel.send({
      embeds: [
        Embed.json({
          color: colors.ok,
          description: stripIndents`
          ${bold('User:')} ${targetUser} (${targetUser.tag} / ${targetUser.id})
          ${bold('Action:')} Kick
          ${bold('Staff:')} ${staff}
          ${entry.reason ? `${bold('Reason:')} ${entry.reason}` : ''}
          `,
          author: {
            name: `${staff.user.tag} (${staff.id})`,
            icon_url: staff.displayAvatarURL()
          }
        })
      ]
    })
  }

  async banUnban (entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
    assert(entry.targetId && entry.executorId)

    const action = entry.action === AuditLogEvent.MemberBanAdd ? 'ban' : 'unban'

    const _case = {
      type: action,
      targetId: entry.targetId,
      reason: entry.reason ?? '',
      staffId: entry.executorId,
      guildId: guild.id
    } satisfies Case

    await sql`
      INSERT INTO "kbCases"
      ${sql(_case as Record<string, unknown>, ...Object.keys(_case))}
    `

    const [item] = await sql<[Pick<kGuild, 'mod_log_channel'>?]>`
      SELECT mod_log_channel FROM kbGuild
      WHERE guild_id = ${guild.id}::text
      LIMIT 1;
    `

    if (!item?.mod_log_channel) {
      return
    }

    const me = await guild.members.fetchMe()
    const channel = await guild.channels.fetch(item.mod_log_channel)

    if (
      channel === null ||
      !isGuildTextBased(channel) ||
      !channel.permissionsFor(me).has(perms)
    ) {
      return
    }

    const staff = await guild.members.fetch(entry.executorId)
    const targetUser = await guild.client.users.fetch(entry.targetId)

    await channel.send({
      embeds: [
        Embed.json({
          color: colors.ok,
          description: stripIndents`
          ${bold('User:')} ${targetUser} (${targetUser.tag} / ${targetUser.id})
          ${bold('Action:')} ${upperCase(action)}
          ${bold('Staff:')} ${staff}
          ${entry.reason ? `${bold('Reason:')} ${entry.reason}` : ''}
          `,
          author: {
            name: `${staff.user.tag} (${staff.id})`,
            icon_url: staff.displayAvatarURL()
          }
        })
      ]
    })
  }
}
