import { Event } from '../../Structures/Event.js';
import { RegisterEvent } from '../../Structures/Decorator.js';
import { GuildEmoji, Permissions, Channel } from 'discord.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { validSnowflake } from '../../lib/Utility/Mentions.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

type LogChannel = Pick<kGuild, 'complete_log_channel'>;

@RegisterEvent
export class kEvent extends Event<'emojiUpdate'> {
    name = 'emojiUpdate' as const;

    async init(oldEmoji: GuildEmoji, newEmoji: GuildEmoji) {
        if (
            (oldEmoji.available && !newEmoji.available) || // api trouble
            (!oldEmoji.available && newEmoji.available) || // api trouble
            oldEmoji.animated !== newEmoji.animated || // can't change
            oldEmoji.deletable !== newEmoji.deletable || // lost perms, don't care
            oldEmoji.deleted !== newEmoji.deleted // handled in other event
        ) {
            return;
        }

        const cached = await client.exists(oldEmoji.guild.id) === 1;
        let item: LogChannel | null = null;

        if (cached) {
            item = JSON.parse(await client.get(oldEmoji.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<LogChannel>(`
                SELECT complete_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [oldEmoji.guild.id]);

            void client.set(oldEmoji.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        if (!validSnowflake(item.complete_log_channel)) return;

        let channel: Channel | null = null;
        if (oldEmoji.guild.channels.cache.has(item.complete_log_channel)) {
            channel = oldEmoji.guild.channels.cache.get(item.complete_log_channel) ?? null;
        } else {
            const [err, chan] = await dontThrow(oldEmoji.guild.client.channels.fetch(item.complete_log_channel));
            if (err !== null) return;
            channel = chan;
        }

        if (!isText(channel) || !hasPerms(channel, oldEmoji.guild.me, basic))
            return;

        const embed = Embed.success(`${newEmoji} was updated!`)
            .setTitle('Emoji Updated');

        if (newEmoji.author || oldEmoji.author) {
            const author = newEmoji.author ?? oldEmoji.author;
            if (author !== null)
                embed.setAuthor(author.username, author.displayAvatarURL());
        }

        if (oldEmoji.name !== newEmoji.name) {
            embed.addField('**Name:**', `${oldEmoji.name} -> ${newEmoji.name}`, true);
        } 
        
        if (oldEmoji.roles.cache.size !== newEmoji.roles.cache.size) {
            if (oldEmoji.roles.cache.size < newEmoji.roles.cache.size) {
                const gainedAccess = [...newEmoji.roles.cache.filter(r => !oldEmoji.roles.cache.has(r.id)).values()];
                embed.addField('**Gained Access:**', gainedAccess.join(', '), true);
            } else {
                const lostAccess = [...oldEmoji.roles.cache.filter(r => !newEmoji.roles.cache.has(r.id)).values()];
                embed.addField('**Lost Access:**', lostAccess.join(', '), true);
            }
        }

        embed.setThumbnail(newEmoji.url);

        return dontThrow(channel.send({ embeds: [embed] }));
    }
}