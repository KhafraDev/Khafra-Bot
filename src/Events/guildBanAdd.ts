import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { GuildBan } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild } from '../lib/types/KhafraBot.js';
import { isText } from '../lib/types/Discord.js.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { bans } from '../lib/Cache/Bans.js';
import { time } from '@discordjs/builders';
import { delay } from '../lib/Utility/Constants/OneLiners.js';
import { client } from '../Structures/Database/Redis.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';

type modLogChannel = Pick<kGuild, 'mod_log_channel'>;

@RegisterEvent
export class kEvent extends Event<'guildBanAdd'> {
    name = 'guildBanAdd' as const;

    async init({ guild, user, reason }: GuildBan) {
        const key = `${guild.id},${user.id}`;
        const cached = await client.exists(guild.id) === 1;
        let item: modLogChannel | null = null

        if (cached) {
            item = JSON.parse(await client.get(guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<modLogChannel>(`
                SELECT mod_log_channel FROM kbGuild
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
            return bans.delete(key);

        const channel = guild.channels.cache.get(item.mod_log_channel);
        if (!isText(channel))
            return bans.delete(key);

        // so you might be thinking "this is disgusting"
        // and I would mostly agree with you. This event is propagated
        // right after the ban and it's entirely possible for the event to fire
        // before the cache is set.
        for (let i = 0; i < 10; i++) {
            if (bans.has(key)) break;
            await delay(1000);
        }

        const ban = bans.has(key) ? bans.get(key) : null;
        const reasonStr = reason ?? (ban?.reason || 'Unknown');

        await dontThrow(channel.send({ 
            embeds: [
                Embed.success(`
                **User:** ${user} (${user.tag})
                **ID:** ${user.id}
                **Staff:** ${ban?.member ?? 'Unknown'}
                **Time:** ${time(new Date())}
                **Reason:** \`\`${reasonStr.length > 1500 ? `${reasonStr.slice(1500)}...` : reasonStr}\`\`
                `).setTitle('Member Banned') 
            ] 
        }));

        bans.delete(key);
    }
}