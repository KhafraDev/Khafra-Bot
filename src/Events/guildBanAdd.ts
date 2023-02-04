import { sql } from '#khaf/database/Postgres.js'
import type { Event } from '#khaf/Event'
import type { Case } from '#khaf/functions/case/reports.js'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import * as DiscordUtil from '#khaf/utility/Discord.js'
import { seconds } from '#khaf/utility/ms.js'
import { ellipsis } from '#khaf/utility/String.js'
import { bold, inlineCode } from '@discordjs/builders'
import { AuditLogEvent, PermissionFlagsBits, type APIEmbedAuthor } from 'discord-api-types/v10'
import { Events, type GuildBan, type User } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

type kGuildModChannel = Pick<kGuild, 'mod_log_channel'>

/**
 * Audit logs entries aren't guaranteed to be added before/after
 * the event has been received from the socket. If we receive it
 * in +/- 10 seconds from the event, it is more likely to be the
 * correct event.
 */
const threshold = seconds(10)
const auditLogPerms = PermissionFlagsBits.ViewAuditLog
const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildBanAdd as const

  async init ({ guild, user }: GuildBan): Promise<void> {
    // This event will always return "partial" bans,
    // where the reason & executor are not included!
    // Plus, the reason, if fetched, can be null anyways!
    // So, it's far more useful to try fetching the audit
    // logs which includes the ban executor AND reason!

    const me = guild.members.me
    const start = Date.now()

    let staff: User | null = null
    let reason: string | null = null

    if (me?.permissions.has(auditLogPerms)) {
      auditLog: {
        for (let i = 0; i < 5; i++, i !== 4 && await setTimeout(seconds(2))) {
          const logs = await guild.fetchAuditLogs({
            type: AuditLogEvent.MemberBanAdd,
            limit: 5
          })

          for (const entry of logs.entries.values()) {
            const diff = Math.abs(start - entry.createdTimestamp)

            if (diff < threshold) {
              if (entry.executor && entry.executor.id !== guild.client.user.id) {
                const _case = {
                  type: 'ban',
                  targetId: user.id,
                  reason: entry.reason!,
                  staffId: entry.executor.id,
                  guildId: guild.id
                } satisfies Case

                await sql`
                  INSERT INTO "kbCases"
                  ${sql(_case as Record<string, unknown>, ...Object.keys(_case))}
                `
              }

              staff = entry.executor
              reason = entry.reason
              break auditLog
            }
          }
        }
      }
    }

    const [item] = await sql<[kGuildModChannel?]>`
      SELECT mod_log_channel
      FROM kbGuild
      WHERE guild_id = ${guild.id}::text
      LIMIT 1;
    `

    if (!item?.mod_log_channel) {
      return
    }

    const channel = await guild.channels.fetch(item.mod_log_channel)

    if (
      channel === null ||
      me === null ||
      !DiscordUtil.isTextBased(channel) ||
      !channel.permissionsFor(me).has(perms)
    ) {
      return
    }

    const author: APIEmbedAuthor | undefined = staff !== null
      ? {
        name: `${staff.tag} (${staff.id})`,
        icon_url: staff.displayAvatarURL()
      }
      : undefined

    let description = `${bold('User:')} ${inlineCode(user.tag)} (${user.id})`
    description += `\n${bold('Action:')} Ban`

    if (staff !== null) {
      description += `\n${bold('Staff:')} ${staff}`
    }

    if (reason !== null) {
      description += `\n${bold('Reason:')} ${inlineCode(ellipsis(reason, 1500))}`
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
