import { Event } from '../../Structures/Event.js';
import { RegisterEvent } from '../../Structures/Decorator.js';
import { Permissions, Channel, GuildChannel } from 'discord.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { upperCase } from '../../lib/Utility/String.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

type LogChannel = Pick<kGuild, 'complete_log_channel'>;

@RegisterEvent
export class kEvent extends Event<'channelDelete'> {
    name = 'channelDelete' as const;

    async init(channel: GuildChannel) {
        const cached = await client.exists(channel.guild.id) === 1;
        let item: LogChannel | null = null;

        if (cached) {
            item = JSON.parse(await client.get(channel.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<LogChannel>(`
                SELECT complete_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [channel.guild.id]);

            void client.set(channel.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        let logChannel: Channel | null = null;
        if (channel.guild.channels.cache.has(item.complete_log_channel)) {
            logChannel = channel.guild.channels.cache.get(item.complete_log_channel);
        } else {
            const [err, chan] = await dontThrow(channel.guild.client.channels.fetch(item.complete_log_channel));
            if (err !== null) return;
            logChannel = chan;
        }

        if (!isText(logChannel) || !hasPerms(logChannel, channel.guild.me, basic))
            return;

        const embed = Embed.success(`${upperCase(channel.type)} channel ${channel} (${channel.name}, ${channel.id}) was deleted!`)
            .setTitle('Channel Deleted');

        return dontThrow(logChannel.send({ embeds: [embed] }));
    }
}