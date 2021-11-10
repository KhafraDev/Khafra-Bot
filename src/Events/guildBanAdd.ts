import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { GuildBan } from 'discord.js';
import { defaultKGuild, pool } from '../Structures/Database/Postgres.js';
import { kGuild, PartialGuild } from '../lib/types/KhafraBot.js';
import { isText } from '../lib/types/Discord.js.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { bans } from '../lib/Cache/Bans.js';
import { bold, inlineCode, time } from '@khaf/builders';
import { delay } from '../lib/Utility/Constants/OneLiners.js';
import { client } from '../Structures/Database/Redis.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';
import { ellipsis } from '../lib/Utility/String.js';

type ModLogChannel = Pick<kGuild, keyof PartialGuild>;

@RegisterEvent
export class kEvent extends Event<'guildBanAdd'> {
    name = 'guildBanAdd' as const;

    async init({ guild, user, reason }: GuildBan) {
        const key = `${guild.id},${user.id}`;
        const row = await client.get(guild.id);
        let item: ModLogChannel = JSON.parse(row!) as kGuild;

        if (!item) {
            const { rows } = await pool.query<ModLogChannel>(`
                SELECT ${defaultKGuild} FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [guild.id]);

            if (rows.length !== 0) {
                void client.set(guild.id, JSON.stringify(rows[0]), 'EX', 600);
                item = rows[0];
            }
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
                ${bold('User:')} ${user} (${user.tag})
                ${bold('ID:')} ${user.id}
                ${bold('Staff:')} ${ban?.member ?? 'Unknown'}
                ${bold('Time:')} ${time(new Date())}
                ${bold('Reason:')} ${inlineCode(ellipsis(reasonStr, 1500))}
                `).setTitle('Member Banned') 
            ] 
        }));

        bans.delete(key);
    }
}