import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { GuildBan } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild, PartialGuild } from '../lib/types/KhafraBot.js';
import { isText } from '../lib/types/Discord.js.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { unbans } from '../lib/Cache/Unban.js';
import { time } from '@discordjs/builders';
import { delay } from '../lib/Utility/Constants/OneLiners.js';
import { client } from '../Structures/Database/Redis.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';

type ModLogChannel = Pick<kGuild, keyof PartialGuild>;

@RegisterEvent
export class kEvent extends Event<'guildBanRemove'> {
    name = 'guildBanRemove' as const;

    async init({ guild, user, reason }: GuildBan) {
        const key = `${guild.id},${user.id}`;
        const cached = await client.exists(guild.id) === 1;
        let item: ModLogChannel | null = null

        if (cached) {
            item = JSON.parse(await client.get(guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<ModLogChannel>(`
                SELECT prefix, mod_log_channel, max_warning_points, welcome_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [guild.id]);

            void client.set(guild.id, JSON.stringify(rows[0]), 'EX', 600);
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
        for (let i = 0; i < 10; i++) {
            if (unbans.has(key)) break;
            await delay(1000);
        }

        const unban = unbans.has(key) ? unbans.get(key) : null;
        const reasonStr = reason ?? (unban?.reason || 'Unknown');

        await dontThrow(channel.send({ 
            embeds: [
                Embed.success(`
                **User:** ${user} (${user.tag})
                **ID:** ${user.id}
                **Staff:** ${unban?.member ?? 'Unknown'}
                **Time:** ${time(new Date())}
                **Reason:** \`\`${reasonStr.length > 1500 ? `${reasonStr.slice(1500)}...` : reasonStr}\`\`
                `).setTitle('Member Unbanned') 
            ]
        }));

        unbans.delete(key);
    }
}