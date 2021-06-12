import { Event } from '../Structures/Event.js';
import { GuildMember, Channel, Permissions, Snowflake } from 'discord.js';
import { pool } from '../Structures/Database/Postgres.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { isText } from '../lib/types/Discord.js.js';
import { client } from '../Structures/Database/Redis.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterEvent
export class kEvent extends Event {
    name = 'guildMemberAdd' as const;

    async init(member: GuildMember) {  
        await pool.query(`
            INSERT INTO kbInsights (
                k_guild_id, k_joined
            ) VALUES (
                $1::text, 1::integer
            ) ON CONFLICT (k_guild_id, k_date) DO UPDATE SET
                k_joined = kbInsights.k_joined + 1
                WHERE kbInsights.k_guild_id = $1::text;
        `, [member.guild.id]);

        const cached = await client.exists(member.guild.id) === 1;
        let item: { welcome_channel: Snowflake } | null = null

        if (cached) {
            item = JSON.parse(await client.get(member.guild.id));
        } else {
            const { rows } = await pool.query<{ welcome_channel: Snowflake }>(`
                SELECT welcome_channel
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [member.guild.id]);
            
            item = rows[0];
        }

        if (!item || item.welcome_channel === null) return;

        let channel: Channel;
        if (member.guild.channels.cache.has(item.welcome_channel)) {
            channel = member.guild.channels.cache.get(item.welcome_channel);
        } else {
            try {
                channel = await member.guild.client.channels.fetch(item.welcome_channel);
            } catch (e) {
                return;
            }
        }

        if (!isText(channel) || !hasPerms(channel, member.guild.me, basic))
            return;
        
        const embed = Embed.success()
            .setAuthor(member.user.username, member.user.displayAvatarURL())
            .setDescription(`${member.user} (${member.user.tag}) joined the server!`);

        try {
            return channel.send({ embeds: [embed] });
        } catch {}
    }
}