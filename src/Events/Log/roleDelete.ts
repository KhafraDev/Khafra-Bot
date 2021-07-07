import { Event } from '../../Structures/Event.js';
import { RegisterEvent } from '../../Structures/Decorator.js';
import { Permissions, Channel, Role } from 'discord.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

type LogChannel = Pick<kGuild, 'complete_log_channel'>;

@RegisterEvent
export class kEvent extends Event {
    name = 'roleDelete' as const;

    async init(role: Role) {
        const cached = await client.exists(role.guild.id) === 1;
        let item: LogChannel | null = null;

        if (cached) {
            item = JSON.parse(await client.get(role.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<LogChannel>(`
                SELECT complete_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [role.guild.id]);

            void client.set(role.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        let channel: Channel | null = null;
        if (role.guild.channels.cache.has(item.complete_log_channel)) {
            channel = role.guild.channels.cache.get(item.complete_log_channel);
        } else {
            try {
                channel = await role.guild.client.channels.fetch(item.complete_log_channel);
            } catch (e) {
                return;
            }
        }

        if (!isText(channel) || !hasPerms(channel, role.guild.me, basic))
            return;

        const embed = Embed.success(`The role ${role} (${role.name}, ${role.id}) was deleted.`)
            .setTitle('Role Deleted');

        try {
            return channel.send({ embeds: [embed] });
        } catch {}
    }
}