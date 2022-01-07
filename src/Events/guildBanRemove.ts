import { Event } from '#khaf/Event';
import { GuildBan, Permissions, User } from 'discord.js';
import { defaultKGuild, pool } from '#khaf/database/Postgres.js';
import { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { isText } from '#khaf/utility/Discord.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, inlineCode, time } from '@khaf/builders';
import { client } from '#khaf/database/Redis.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ellipsis } from '#khaf/utility/String.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { AuditLogEvent } from 'discord-api-types/v9';

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

        const row = await client.get(guild.id);
        let item: ModLogChannel | null = row !== null
            ? JSON.parse(row) as kGuild
            : null;

        if (!item) {
            const { rows } = await pool.query<ModLogChannel>(`
                SELECT ${defaultKGuild} FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [guild.id]);

            if (rows.length !== 0) {
                void client.set(guild.id, JSON.stringify(rows[0]), 'EX', 600);
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