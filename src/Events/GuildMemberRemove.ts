import { cache } from '#khaf/cache/Settings.js';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { time } from '@khaf/builders';
import { AnyChannel, GuildMember, Permissions } from 'discord.js';
import { join } from 'path';

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

        await sql<unknown[]>`
            INSERT INTO kbInsights (
                k_guild_id, k_left
            ) VALUES (
                ${member.guild.id}::text, ${1}::integer
            ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
                k_left = kbInsights.k_left + 1
                WHERE kbInsights.k_guild_id = ${member.guild.id}::text;
        `;

        const row = cache.get(member.guild.id);
        let item: WelcomeChannel | null = row ?? null;
        
        if (!item) {
            const rows = await sql<kGuild[]>`
                SELECT
                    prefix, mod_log_channel, max_warning_points,
                    welcome_channel, ticketChannel, "staffChannel"
                FROM kbGuild
                WHERE guild_id = ${member.guild.id}::text
                LIMIT 1;
            `;
            
            if (rows.length !== 0) {
                cache.set(member.guild.id, rows[0]);
                item = rows[0];
            } else {
                return;
            }
        }

        if (item.welcome_channel === null) return;

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
            (member.joinedAt ? time(member.joinedAt) : 'N/A') +
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