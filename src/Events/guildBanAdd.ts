import { cache } from '#khaf/cache/Settings.js';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import type { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { isTextBased } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { ellipsis } from '#khaf/utility/String.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import { AuditLogEvent, PermissionFlagsBits } from 'discord-api-types/v10';
import { Events, type GuildBan, type User } from 'discord.js';

type ModLogChannel = Pick<kGuild, keyof PartialGuild>;

const auditLogPerms = PermissionFlagsBits.ViewAuditLog;
const perms =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks;

export class kEvent extends Event<typeof Events.GuildBanAdd> {
    name = Events.GuildBanAdd as const;

    async init ({ guild, user, reason }: GuildBan): Promise<void> {
        // This event will always return "partial" bans,
        // where the reason & executor are not included!
        // Plus, the reason, if fetched, can be null anyways!
        // So, it's far more useful to try fetching the audit
        // logs which includes the unban executor AND reason!

        let staff: User | null = null;

        if (guild.members.me?.permissions.has(auditLogPerms)) {
            const [err, logs] = await dontThrow(guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1
            }));

            if (err === null) {
                const entry = logs.entries.first();

                if (entry?.executor) staff = entry.executor;
                if (entry?.reason) reason = entry.reason;
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

            if (rows.length !== 0) {
                cache.set(guild.id, rows[0]);
                item = rows[0];
            } else {
                return;
            }
        }

        const channel = guild.channels.cache.get(item.mod_log_channel ?? '');

        if (!channel) {
            return;
        } else if (!isTextBased(channel) || !hasPerms(channel, guild.members.me, perms)) {
            return;
        }

        return void dontThrow(channel.send({
            embeds: [
                Embed.json({
                    color: colors.ok,
                    description: `
                    ${bold('User:')} ${user} (${user.tag})
                    ${bold('ID:')} ${user.id}
                    ${bold('Staff:')} ${staff ?? 'Unknown'}
                    ${bold('Time:')} ${time(new Date())}
                    ${bold('Reason:')} ${inlineCode(ellipsis(reason ?? 'Unknown', 1500))}`,
                    title: 'Member Banned'
                })
            ]
        }));
    }
}