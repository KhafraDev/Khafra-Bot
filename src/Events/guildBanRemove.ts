import { cache } from '#khaf/cache/Settings.js';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import * as DiscordUtil from '#khaf/utility/Discord.js';
import { ellipsis } from '#khaf/utility/String.js';
import { bold, inlineCode } from '@discordjs/builders';
import { AuditLogEvent, PermissionFlagsBits, type APIEmbedAuthor } from 'discord-api-types/v10';
import { Events, SnowflakeUtil, type GuildBan, type User } from 'discord.js';
import { setTimeout } from 'node:timers/promises';

type ModLogChannel = Pick<kGuild, keyof PartialGuild>;

/**
 * Audit logs entries aren't guaranteed to be added before/after
 * the event has been received from the socket. If we receive it
 * in +/- 10 seconds from the event, it is more likely to be the
 * correct event.
 */
const threshold = 10_000
const auditLogPerms = PermissionFlagsBits.ViewAuditLog;
const perms =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks;

export class kEvent extends Event<typeof Events.GuildBanRemove> {
    name = Events.GuildBanRemove as const;

    async init ({ guild, user }: GuildBan): Promise<void> {
        // This event will always return "partial" unbans,
        // where the reason & executor are not included!
        // Plus, the reason, if fetched, can be null anyways!
        // So, it's far more useful to try fetching the audit
        // logs which includes the unban executor AND reason!

        const me = guild.members.me
        const start = Date.now()

        let staff: User | null = null
        let reason: string | null = null

        if (me?.permissions.has(auditLogPerms)) {
            for (let i = 0; i < 5; i++) {
                const logs = await guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberBanRemove,
                    limit: 5
                });

                for (const entry of logs.entries.values()) {
                    const diff = Math.abs(start - SnowflakeUtil.timestampFrom(entry.id))

                    if (diff < threshold) {
                        staff = entry.executor
                        reason = entry.reason
                        break
                    }
                }

                if (i !== 4) {
                    await setTimeout(2_000)
                }
            }
        }

        const row = cache.get(guild.id);
        let item: ModLogChannel | null = row ?? null;

        if (!item) {
            const rows = await sql<kGuild[]>`
                SELECT 
                    mod_log_channel, max_warning_points,
                    welcome_channel, ticketChannel, "staffChannel"
                FROM kbGuild
                WHERE guild_id = ${guild.id}::text
                LIMIT 1;
            `;

            if (rows.length === 0) {
                return
            }

            cache.set(guild.id, rows[0]);
            item = rows[0];
        }

        const channel = item.mod_log_channel ? guild.channels.cache.get(item.mod_log_channel) : undefined

        if (
            channel === undefined ||
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
        description += `\n${bold('Action:')} Unban`

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