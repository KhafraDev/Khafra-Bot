import { Event } from '../Structures/Event.js';
import { GuildMember, Channel, Permissions } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { isText } from '../lib/types/Discord.js.js';
import { client } from '../Structures/Database/Redis.js';
import { kGuild } from '../lib/types/KhafraBot.js';
import { time } from '@discordjs/builders';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

type welcomeChannel = Pick<kGuild, 'welcome_channel'>;

@RegisterEvent
export class kEvent extends Event<'guildMemberRemove'> {
    name = 'guildMemberRemove' as const;

    async init(member: GuildMember) {
        await pool.query(`
            INSERT INTO kbInsights (
                k_guild_id, k_left
            ) VALUES (
                $1::text, 1::integer
            ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
                k_left = kbInsights.k_left + 1
                WHERE kbInsights.k_guild_id = $1::text;
        `, [member.guild.id]);

        const cached = await client.exists(member.guild.id) === 1;
        let item: welcomeChannel | null = null

        if (cached) {
            item = JSON.parse(await client.get(member.guild.id)) as kGuild;
        } else {
            const { rows } = await pool.query<welcomeChannel>(`
                SELECT welcome_channel
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [member.guild.id]);
            
            void client.set(member.guild.id, JSON.stringify(rows[0]), 'EX', 600);
            item = rows[0];
        }

        if (!item || item.welcome_channel === null) return;

        let channel: Channel | null = null;
        if (member.guild.channels.cache.has(item.welcome_channel)) {
            channel = member.guild.channels.cache.get(item.welcome_channel) ?? null;
        } else {
            const [err, c] = await dontThrow(member.guild.client.channels.fetch(item.welcome_channel));
            if (err !== null) return;
            channel = c;
        }

        if (!isText(channel) || !hasPerms(channel, member.guild.me, basic))
            return;

        const embed = Embed.success()
            .setAuthor(member.user.username, member.user.displayAvatarURL())
            .setDescription(`
            ${member} (${member.user.tag}) has left the server!
            • Account Created: ${time(member.user.createdAt)} (${time(member.user.createdAt, 'R')})
            • Joined: ${time(member.joinedAt!)} (${time(member.joinedAt!, 'R')})
            • Left: ${time(new Date())} (${time(new Date(), 'R')})
            `)
            .setFooter('User left');

        return dontThrow(channel.send({ embeds: [embed] }));
    }
}