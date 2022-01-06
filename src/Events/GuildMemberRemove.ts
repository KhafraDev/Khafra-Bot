import { time } from '@khaf/builders';
import { AnyChannel, GuildMember, Permissions } from 'discord.js';
import { join } from 'path';
import { isText } from '#khaf/utility/Discord.js';
import { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { defaultKGuild, pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';
import { Event } from '#khaf/Event';

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

const basic = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

type WelcomeChannel = Pick<kGuild, keyof PartialGuild>;

export class kEvent extends Event<'guildMemberRemove'> {
    name = 'guildMemberRemove' as const;

    async init(member: GuildMember) {
        if (member.id === config.botId) return;

        await pool.query(`
            INSERT INTO kbInsights (
                k_guild_id, k_left
            ) VALUES (
                $1::text, 1::integer
            ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
                k_left = kbInsights.k_left + 1
                WHERE kbInsights.k_guild_id = $1::text;
        `, [member.guild.id]);

        const row = await client.get(member.guild.id);
        let item: WelcomeChannel = JSON.parse(row!) as kGuild;
        
        if (!item) {
            const { rows } = await pool.query<WelcomeChannel>(`
                SELECT ${defaultKGuild}
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [member.guild.id]);
            
            if (rows.length !== 0) {
                void client.set(member.guild.id, JSON.stringify(rows[0]), 'EX', 600);
                item = rows[0];
            }
        }

        if (!item || item.welcome_channel === null) return;

        let channel: AnyChannel | null = null;
        if (member.guild.channels.cache.has(item.welcome_channel)) {
            channel = member.guild.channels.cache.get(item.welcome_channel) ?? null;
        } else {
            const [err, c] = await dontThrow(member.guild.client.channels.fetch(item.welcome_channel));
            if (err !== null) return;
            channel = c;
        }

        if (!isText(channel) || !hasPerms(channel, member.guild.me, basic))
            return;

        const joined = 
            member.joinedAt ? time(member.joinedAt) : 'N/A' +
            ` (${member.joinedAt ? time(member.joinedAt, 'R') : 'N/A'})`;

        const embed = Embed.ok()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
            .setDescription(`
            ${member} (${member.user.tag}) has left the server!
            • Account Created: ${time(member.user.createdAt)} (${time(member.user.createdAt, 'R')})
            • Joined: ${joined}
            • Left: ${time(new Date())} (${time(new Date(), 'R')})
            `)
            .setFooter({ text: 'User left' });

        return void dontThrow(channel.send({ embeds: [embed] }));
    }
}