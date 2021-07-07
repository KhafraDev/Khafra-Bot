import { Event } from '../../Structures/Event.js';
import { RegisterEvent } from '../../Structures/Decorator.js';
import { Permissions, Channel, Role } from 'discord.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { inlineCode } from '@discordjs/builders';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

const yes = (b: boolean) => b ? 'Yes' : 'No';

type LogChannel = Pick<kGuild, 'complete_log_channel'>;

@RegisterEvent
export class kEvent extends Event {
    name = 'roleUpdate' as const;

    async init(oldRole: Role, newRole: Role) {
        if (
            oldRole.deleted !== newRole.deleted || // handled in other event
            oldRole.editable !== newRole.editable || // perms changed
            oldRole.members.size !== newRole.members.size || // someone gained/lost role
            oldRole.tags !== newRole.tags ||
            oldRole.rawPosition !== newRole.rawPosition
        ) {
            return;
        }

        const cached = await client.exists(oldRole.guild.id) === 1;
        let item: LogChannel | null = null;

        if (cached) {
            item = JSON.parse(await client.get(oldRole.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<LogChannel>(`
                SELECT complete_log_channel FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [oldRole.guild.id]);

            void client.set(oldRole.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        let channel: Channel | null = null;
        if (oldRole.guild.channels.cache.has(item.complete_log_channel)) {
            channel = oldRole.guild.channels.cache.get(item.complete_log_channel);
        } else {
            try {
                channel = await oldRole.guild.client.channels.fetch(item.complete_log_channel);
            } catch (e) {
                return;
            }
        }

        if (!isText(channel) || !hasPerms(channel, oldRole.guild.me, basic))
            return;

        const embed = Embed.success(`${oldRole} was updated!`)
            .setTitle('Role Updated');

        if (oldRole.color !== newRole.color)
            embed.addField('**Color:**', `${oldRole.hexColor} -> ${newRole.hexColor}`, true);

        if (oldRole.hoist !== newRole.hoist)
            embed.addField('**Hoisted:**', `${yes(oldRole.hoist)} -> ${yes(newRole.hoist)}`, true);
        
        if (oldRole.managed !== newRole.managed)
            embed.addField('**Managed:**', `${yes(oldRole.managed)} -> ${yes(newRole.managed)}`, true);

        if (oldRole.mentionable !== newRole.mentionable)
            embed.addField('**Mentionable:**', `${yes(oldRole.mentionable)} -> ${yes(newRole.mentionable)}`, true);

        if (oldRole.name !== newRole.name)
            embed.addField('**Name:**', `${oldRole.name} -> ${newRole.name}`, true);

        if (oldRole.position !== newRole.position)
            embed.addField('**Position:**', `${oldRole.position} -> ${newRole.position}`, true);
        
        if (!oldRole.permissions.equals(newRole.permissions)) {
            const oldP = oldRole.permissions.toArray();
            const newP = newRole.permissions.toArray();

            if (oldP.length < newP.length) {
                const missing = newRole.permissions.missing(oldRole.permissions);
                if (missing.length > 0)
                    embed.addField('**New Perms:**', inlineCode(missing.join(', ').slice(0, 1020)));
            } else {
                const missing = oldRole.permissions.missing(newRole.permissions);
                if (missing.length > 0)
                    embed.addField('**New Perms:**', inlineCode(missing.join(', ').slice(0, 1020)));
            }
        }

        try {
            return channel.send({ embeds: [embed] });
        } catch {}
    }
}