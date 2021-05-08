import { Event } from '../Structures/Event.js';
import { GuildMember, Channel, Permissions } from 'discord.js';
import { pool } from '../Structures/Database/Mongo.js';
import { formatDate } from '../lib/Utility/Date.js';
import { GuildSettings } from '../lib/types/Collections';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { isText } from '../lib/types/Discord.js.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterEvent
export class kEvent extends Event {
    name = 'guildMemberRemove' as const;

    async init(member: GuildMember) {
        const date = formatDate('MM-DD-YYYY', new Date());
        const client = await pool.insights.connect();
        
        const insightsCollection = client.db('khafrabot').collection('insights');   
        const settingsCollection = client.db('khafrabot').collection('settings');
            
        await insightsCollection.updateOne(
            { id: member.guild.id },
            { $inc: { 
                [`daily.${date}.total`]: -1,
                [`daily.${date}.left`]: 1
            } },
            { upsert: true }
        );

        const server = await settingsCollection.findOne<GuildSettings>({ id: member.guild.id });
        if (!server?.welcomeChannel) {
            return;
        }

        let channel: Channel;
        if (member.guild.channels.cache.has(server.welcomeChannel)) {
            channel = member.guild.channels.cache.get(server.welcomeChannel);
        } else {
            try {
                channel = await member.guild.client.channels.fetch(server.welcomeChannel);
            } catch {
                return;
            }
        }

        if (!isText(channel) || !hasPerms(channel, member.guild.me, basic))
            return;

        const embed = Embed.success()
            .setAuthor(member.user.username, member.user.displayAvatarURL())
            .setDescription(`${member.user} (${member.user.tag}) has left the server!`);

        try {
            return channel.send(embed);
        } catch {}
    }
}