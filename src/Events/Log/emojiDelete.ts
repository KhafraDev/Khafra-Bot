import { Event } from '../../Structures/Event.js';
import { RegisterEvent } from '../../Structures/Decorator.js';
import { GuildEmoji, Permissions, Channel } from 'discord.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { inlineCode } from '@discordjs/builders';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

type LogChannel = Pick<kGuild, 'complete_log_channel'>;

@RegisterEvent
export class kEvent extends Event<'emojiDelete'> {
    name = 'emojiDelete' as const;

    async init(emoji: GuildEmoji) {
        const cached = await client.exists(emoji.guild.id) === 1;
        let item: LogChannel | null = null;

        if (cached) {
            item = JSON.parse(await client.get(emoji.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<LogChannel>(`
                SELECT complete_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [emoji.guild.id]);

            void client.set(emoji.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        let channel: Channel | null = null;
        if (emoji.guild.channels.cache.has(item.complete_log_channel)) {
            channel = emoji.guild.channels.cache.get(item.complete_log_channel);
        } else {
            const [err, chan] = await dontThrow(emoji.guild.client.channels.fetch(item.complete_log_channel));
            if (err !== null) return;
            channel = chan;
        }

        if (!isText(channel) || !hasPerms(channel, emoji.guild.me, basic))
            return;

        const embed = Embed.success(
            `${emoji.author ?? ''} deleted the emoji ${inlineCode(emoji.name)} (${emoji.id})`.trim()
        );

        if (emoji.author) {
            embed.setAuthor(emoji.author.username, emoji.author.displayAvatarURL());
        } else {
            embed.setAuthor('An unknown user');
        }

        embed.setThumbnail(emoji.url);

        return dontThrow(channel.send({ embeds: [embed] }));
    }
}