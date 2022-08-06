import { cache } from '#khaf/cache/Settings.js'
import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isText } from '#khaf/utility/Discord.js'
import { hasPerms } from '#khaf/utility/Permissions.js'
import { ellipsis } from '#khaf/utility/String.js'
import { bold, inlineCode, time } from '@discordjs/builders'
import { AuditLogEvent, type APIEmbedAuthor } from 'discord-api-types/v10'
import { Events, PermissionFlagsBits, type AuditLogChange, type Channel, type GuildAuditLogsEntry, type GuildMember } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

const auditLogPerms = PermissionFlagsBits.ViewAuditLog
const basic =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks

type LogChannel = Pick<kGuild, keyof PartialGuild>

export class kEvent extends Event<typeof Events.GuildMemberUpdate> {
    name = Events.GuildMemberUpdate as const

    async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
        const old = oldMember.communicationDisabledUntil
        const current = newMember.communicationDisabledUntil

        if (old === current || old?.getTime() === current?.getTime()) {
            return
        }

        const row = cache.get(oldMember.guild.id)
        let item: LogChannel | null = row ?? null

        if (!item) {
            const rows = await sql<kGuild[]>`
                SELECT
                    mod_log_channel, max_warning_points,
                    welcome_channel, ticketChannel, "staffChannel"
                FROM kbGuild
                WHERE guild_id = ${oldMember.guild.id}::text
                LIMIT 1;
            `

            if (rows.length !== 0) {
                cache.set(oldMember.guild.id, rows[0])
                item = rows[0]
            } else {
                return
            }
        }

        const logChannel = item.mod_log_channel
        const self = oldMember.guild.members.me ?? newMember.guild.members.me

        let channel: Channel | null = null
        let muted: GuildAuditLogsEntry<AuditLogEvent.MemberUpdate, 'Update', 'User'> | undefined
        let change!: AuditLogChange

        if (logChannel === null) {
            return
        } else if (oldMember.guild.channels.cache.has(logChannel)) {
            channel = oldMember.guild.channels.cache.get(logChannel) ?? null
        } else if (self) {
            const chan = await self.client.channels.fetch(logChannel)
            channel = chan
        }

        if (self === null || !isText(channel) || !hasPerms(channel, self, basic)) {
            return
        }

        if (self.permissions.has(auditLogPerms)) {
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