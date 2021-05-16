import { Event } from '../Structures/Event.js';
import { GuildMember, Channel, Permissions } from 'discord.js';
import { pool } from '../Structures/Database/Mongo.js';
import { pool as _pool } from '../Structures/Database/Postgres.js';
import { formatDate } from '../lib/Utility/Date.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { isText } from '../lib/types/Discord.js.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterEvent
export class kEvent extends Event {
    name = 'guildMemberAdd' as const;

    async init(member: GuildMember) {  
        const date = formatDate('MM-DD-YYYY', new Date());
        const client = await pool.insights.connect();

        const insightsCollection = client.db('khafrabot').collection('insights');   
        
        await insightsCollection.updateOne(
            { id: member.guild.id },
            { $inc: { 
                [`daily.${date}.total`]: 1,
                [`daily.${date}.joined`]: 1
            } },
            { upsert: true }
        );

        const { rows } = await _pool.query<{ welcome_channel: string }>(`
            SELECT welcome_channel
            FROM kbGuild
            WHERE guild_id = $1::text
            LIMIT 1;
        `, [member.guild.id]);

        if (rows.length === 0 || rows[0].welcome_channel === null) return;

        let channel: Channel;
        if (member.guild.channels.cache.has(rows[0].welcome_channel)) {
            channel = member.guild.channels.cache.get(rows[0].welcome_channel);
        } else {
            try {
                channel = await member.guild.client.channels.fetch(rows[0].welcome_channel);
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
            return channel.send(embed);
        } catch {}
    }
}