import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { GuildBan } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild } from '../lib/types/Warnings.js';
import { isText } from '../lib/types/Discord.js.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { bans } from '../lib/Cache/Bans.js';
import { formatDate } from '../lib/Utility/Date.js';
import { delay } from '../lib/Utility/Constants/OneLiners.js';
import { Logger } from '../Structures/Logger.js';

const guildBanAddLogger = new Logger('guildBanAdd');

@RegisterEvent
export class kEvent extends Event {
    name = 'guildBanAdd' as const;

    async init({ guild, user, reason }: GuildBan) {
        const key = `${guild.id},${user.id}`;
        const { rows } = await pool.query<kGuild>(`
            SELECT mod_log_channel FROM kbGuild
            WHERE guild_id = $1::text
            LIMIT 1;
        `, [guild.id]);

        if (
            rows.length === 0 || // precaution
            rows[0].mod_log_channel === null || // default value, not set
            !guild.channels.cache.has(rows[0].mod_log_channel) // channel isn't cached
        ) 
            return bans.delete(key);

        const channel = guild.channels.cache.get(rows[0].mod_log_channel);
        if (!isText(channel))
            return bans.delete(key);

        // so you might be thinking "this is disgusting"
        // and I would mostly agree with you. This event is propagated
        // right after the ban and it's entirely possible for the event to fire
        // before the cache is set.
        let i = 0;
        while (!bans.has(key) && i++ < 10) {
            await delay(1000);
        }

        const ban = bans.has(key) ? bans.get(key) : null;

        try {
            await channel.send(Embed.success(`
            **User:** ${user} (${user.tag})
            **ID:** ${user.id}
            **Staff:** ${ban ?? 'Unknown'}
            **Time:** ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}
            **Reason:** \`\`${reason.length > 1500 ? reason.slice(1500) + '...' : reason}\`\`
            `).setTitle('Member Banned'));
        } catch (e) {
            guildBanAddLogger.log(e);
        } finally {
            bans.delete(key);
        }
    }
}