import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { GuildBan } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild } from '../lib/types/Warnings.js';
import { isText } from '../lib/types/Discord.js.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { unbans } from '../lib/Cache/Unban.js';
import { formatDate } from '../lib/Utility/Date.js';
import { delay } from '../lib/Utility/Constants/OneLiners.js';
import { Logger } from '../Structures/Logger.js';
import { client } from '../Structures/Database/Redis.js';

const guildBanRemoveLogger = new Logger('guildBanRemove');

@RegisterEvent
export class kEvent extends Event {
    name = 'guildBanRemove' as const;

    async init({ guild, user, reason }: GuildBan) {
        const key = `${guild.id},${user.id}`;
        const cached = await client.exists(guild.id) === 1;
        let item: kGuild | null = null

        if (cached) {
            item = JSON.parse(await client.get(guild.id));
        } else {
            const { rows } = await pool.query<kGuild>(`
                SELECT mod_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [guild.id]);

            item = rows[0];
        }

        if (
            !item || // precaution
            item.mod_log_channel === null || // default value, not set
            !guild.channels.cache.has(item.mod_log_channel) // channel isn't cached
        ) 
            return unbans.delete(key);

        const channel = guild.channels.cache.get(item.mod_log_channel);
        if (!isText(channel))
            return unbans.delete(key);

        // so you might be thinking "this is disgusting"
        // and I would mostly agree with you. This event is propagated
        // right after the unban and it's entirely possible for the event to fire
        // before the cache is set.
        let i = 0;
        while (!unbans.has(key) && i++ < 10) {
            await delay(1000);
        }

        const unban = unbans.has(key) ? unbans.get(key) : null;

        try {
            await channel.send(Embed.success(`
            **User:** ${user} (${user.tag})
            **ID:** ${user.id}
            **Staff:** ${unban ?? 'Unknown'}
            **Time:** ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}
            **Reason:** \`\`${reason?.length > 1500 ? reason.slice(1500) + '...' : (reason ?? 'Unknown')}\`\`
            `).setTitle('Member Unbanned'));
        } catch (e) {
            guildBanRemoveLogger.log(e);
        } finally {
            unbans.delete(key);
        }
    }
}