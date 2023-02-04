import { sql } from '#khaf/database/Postgres.js'
import type { Event } from '#khaf/Event'
import type { Case } from '#khaf/functions/case/reports'
import type { kGuild } from '#khaf/types/KhafraBot'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { seconds } from '#khaf/utility/ms.js'
import { ellipsis } from '#khaf/utility/String.js'
import { bold, inlineCode, time } from '@discordjs/builders'
import { AuditLogEvent, type APIEmbedAuthor } from 'discord-api-types/v10'
import {
  Events,
  PermissionFlagsBits,
  type GuildAuditLogsEntry,
  type GuildMember
} from 'discord.js'
import { setTimeout } from 'node:timers/promises'

type kGuildModChannel = Pick<kGuild, 'mod_log_channel'>
type kGuildWelcomeChannel = Pick<kGuild, 'welcome_channel'>

const auditLogPerms = PermissionFlagsBits.ViewAuditLog
const basic =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildMemberUpdate as const

  async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const { communicationDisabledUntilTimestamp: old } = oldMember
    const { communicationDisabledUntilTimestamp: current } = newMember

    if (old !== current) {
      return this.timeout(oldMember, newMember)
    }

    // https://discord.js.org/#/docs/main/master/class/RoleManager?scrollTo=premiumSubscriberRole
    const premiumRole =
      oldMember.roles.premiumSubscriberRole ??
      newMember.roles.premiumSubscriberRole ??
      (await newMember.guild.roles.fetch(undefined, { force: true })).find(
        (role) => role.tags?.premiumSubscriberRole
      )

    if (!premiumRole) {
      return
    }

    const oldHas = oldMember.roles.cache.has(premiumRole.id)
    const newHas = newMember.roles.cache.has(premiumRole.id)

    // both either have or don't have the role
    if (oldHas === newHas) {
      return
    }

    return this.booster(oldMember, newMember, oldHas && !newHas)
  }

  async timeout (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const current = newMember.communicationDisabledUntil

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
    let action!: 'mute' | 'unmute'

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
      const start = Date.now()

      auditLog: {
        for (let i = 0; i < 5; i++, i !== 4 && await setTimeout(2000)) {
          const logs = await oldMember.guild.fetchAuditLogs({
            type: AuditLogEvent.MemberUpdate,
            limit: 5
          })

          for (const entry of logs.entries.values()) {
            if (entry.target?.id === oldMember.id) {
              for (const c of entry.changes) {
                if (c.key === 'communication_disabled_until') {
                  // If the change is older than the one we want.
                  if (Math.abs(start - entry.createdTimestamp) >= seconds(10)) {
                    continue
                  }

                  muted = entry

                  if (
                    (c.old === undefined && c.new !== undefined) ||
                    (Date.parse(`${c.old}`) < Date.now())
                  ) {
                    const _case = {
                      type: 'mute',
                      targetId: entry.target.id,
                      reason: entry.reason!,
                      staffId: entry.executor!.id,
                      associatedTime: new Date(`${c.new}`),
                      guildId: oldMember.guild.id
                    } satisfies Case

                    await sql`
                      INSERT INTO "kbCases"
                      ${sql(_case as Record<string, unknown>, ...Object.keys(_case))}
                    `

                    action = 'mute'
                  } else {
                    action = 'unmute'
                  }

                  break auditLog
                }
              }
            }
          }
        }
      }
    }

    if (muted === undefined) {
      return
    }

    const author: APIEmbedAuthor | undefined = muted.executor
      ? {
        name: `${muted.executor.tag} (${muted.executor.id})`,
        icon_url: muted.executor.displayAvatarURL()
      }
      : undefined

    let description = `${bold('User:')} ${inlineCode(oldMember.user.tag)} (${oldMember.user.id})`
    description += `\n${bold('Action:')} ${action}`

    if (muted.executor !== null) {
      description += `\n${bold('Staff:')} ${muted.executor}`
    }

    if (action === 'mute' && current !== null) {
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

  async booster (oldMember: GuildMember, newMember: GuildMember, lost: boolean): Promise<void> {
    const [item] = await sql<[kGuildWelcomeChannel?]>`
      SELECT welcome_channel
      FROM kbGuild
      WHERE guild_id = ${oldMember.guild.id}::text
      LIMIT 1;
    `

    if (!item?.welcome_channel) {
      return
    }

    const channel = await oldMember.guild.channels.fetch(item.welcome_channel)
    const me = oldMember.guild.members.me

    if (
      channel === null ||
      me === null ||
      !isTextBased(channel) ||
      !channel.permissionsFor(me).has(basic)
    ) {
      return
    }

    if (lost) {
      const embed = Embed.json({
        color: colors.error,
        description: `${newMember} is no longer boosting the server! 😨`,
        author: {
          name: newMember.user.username,
          icon_url: newMember.user.displayAvatarURL()
        }
      })

      await channel.send({ embeds: [embed] })
    } else { // gained role
      const embed = Embed.json({
        color: colors.boost,
        description: `${newMember} just boosted the server! 🥳`,
        author: {
          name: newMember.user.username,
          icon_url: newMember.user.displayAvatarURL()
        }
      })

      await channel.send({ embeds: [embed] })
    }
  }
}
