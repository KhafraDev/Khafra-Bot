import { cache } from '#khaf/cache/Settings.js';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { ellipsis } from '#khaf/utility/String.js';
import { bold, inlineCode, time } from '@khaf/builders';
import { AuditLogEvent } from 'discord-api-types/v9';
import { GuildBan, Permissions, User } from 'discord.js';

type ModLogChannel = Pick<kGuild, keyof PartialGuild>;

const auditLogPerms = new Permissions([
    Permissions.FLAGS.VIEW_AUDIT_LOG
]);

const perms = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

export class kEvent extends Event<'guildBanRemove'> {
    name = 'guildBanRemove' as const;

    async init({ guild, user, reason }: GuildBan) {
        // This event will always return "partial" unbans,
        // where the reason & executor are not included!
        // Plus, the reason, if fetched, can be null anyways!
        // So, it's far more useful to try fetching the audit
        // logs which includes the unban executor AND reason!

        let staff: User | null = null;
        
        if (guild.me?.permissions.has(auditLogPerms)) {
            const [err, logs] = await dontThrow(guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanRemove,
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
                    prefix, mod_log_channel, max_warning_points,
                    welcome_channel, reactRoleChannel, ticketChannel 
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
        } else if (!isText(channel) || !hasPerms(channel, guild.me, perms)) {
            return;
        }

        return void dontThrow(channel.send({ 
            embeds: [
                Embed.ok(`
                ${bold('User:')} ${user} (${user.tag})
                ${bold('ID:')} ${user.id}
                ${bold('Staff:')} ${staff ?? 'Unknown'}
                ${bold('Time:')} ${time(new Date())}
                ${bold('Reason:')} ${inlineCode(ellipsis(reason ?? 'Unknown', 1500))}
                `).setTitle('Member Unbanned') 
            ]
        }));
    }
}