import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { Guild, User } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild } from '../lib/types/Warnings.js';
import { isText } from '../lib/types/Discord.js.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { bans } from '../lib/Cache/Bans.js';
import { formatDate } from '../lib/Utility/Date.js';
import { delay } from '../lib/Utility/Constants/OneLiners.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'guildBanAdd' as const;

    async init(guild: Guild, user: User) {
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
        // right after tha ban and it's entirely possible for the event to fire
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
            **Staff:** ${ban?.staff ?? 'Unknown'}
            **Time:** ${formatDate('MMMM Do, YYYY hh:mm:ssA', ban?.time ?? new Date())}
            `).setTitle('Member Banned'));
        } catch {
            // TODO(@KhafraDev): handle this somehow, at the very least log it
        } finally {
            bans.delete(key);
        }
    }
}