import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import type { kGuild } from '#khaf/types/KhafraBot'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { ellipsis } from '#khaf/utility/String.js'
import { bold, inlineCode, time } from '@discordjs/builders'
import { AuditLogEvent, type APIEmbedAuthor } from 'discord-api-types/v10'
import { Events, PermissionFlagsBits, type AuditLogChange, type GuildAuditLogsEntry, type GuildMember } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

type kGuildModChannel = Pick<kGuild, 'mod_log_channel'>

const auditLogPerms = PermissionFlagsBits.ViewAuditLog
const basic =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent extends Event<typeof Events.GuildMemberUpdate> {
  name = Events.GuildMemberUpdate as const

  async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const old = oldMember.communicationDisabledUntil
    const current = newMember.communicationDisabledUntil

    if (old === current || old?.getTime() === current?.getTime()) {
      return
    }

    const [item] = await sql<[kGuildModChannel?]>`
      SELECT
        mod_log_channel, max_warning_points,
        welcome_channel, ticketChannel, "staffChannel"
      FROM kbGuild
      WHERE guild_id = ${oldMember.guild.id}::text
      LIMIT 1;
    `

    if (!item?.mod_log_channel) {
      return
    }

    const logChannel = item.mod_log_channel
    const me = oldMember.guild.members.me

    let muted: GuildAuditLogsEntry<AuditLogEvent.MemberUpdate, 'Update', 'User'> | undefined
    let change!: AuditLogChange

    const channel = await oldMember.guild.channels.fetch(logChannel)

    if (
      channel === null ||
      me === null ||
      !isTextBased(channel) ||
      !channel.permissionsFor(me).has(basic)
    ) {
      return
    }

    if (me.permissions.has(auditLogPerms)) {
      for (let i = 0; i < 5; i++) {
        const logs = await oldMember.guild.fetchAuditLogs({
          type: AuditLogEvent.MemberUpdate,
          limit: 5
        })

        for (const entry of logs.entries.values()) {
          if (entry.target?.id === oldMember.id) {
            for (const c of entry.changes) {
              if (c.key === 'communication_disabled_until') {
                muted = entry
                change = c
                break
              }
            }
          }
        }

        if (i !== 4) {
          await setTimeout(2_000)
        }
      }
    }

    if (muted === undefined) {
      return
    }

    const wasUnmuted = change.old !== undefined && change.new === undefined
    const author: APIEmbedAuthor | undefined = muted.executor
      ? {
        name: `${muted.executor.tag} (${muted.executor.id})`,
        icon_url: muted.executor.displayAvatarURL()
      }
      : undefined

    let description = `${bold('User:')} ${inlineCode(oldMember.user.tag)} (${oldMember.user.id})`
    description += `\n${bold('Action:')} ${wasUnmuted ? 'Unmute' : 'Mute'}`

    if (muted.executor !== null) {
      description += `\n${bold('Staff:')} ${muted.executor}`
    }

    if (!wasUnmuted && current !== null) {
      description += `\n${bold('Until:')} ${time(current, 'F')}`
    }

    if (muted.reason) {
      description += `\n${bold('Reason:')} ${inlineCode(ellipsis(muted.reason, 1500))}`
    }

    return void channel.send({
      embeds: [
        Embed.json({
          color: colors.ok,
          description,
          author
        })
      ]
    }).catch(() => null)
  }
}
