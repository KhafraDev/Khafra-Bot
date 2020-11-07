import { Event } from "../Structures/Event.js";
import { ClientEvents, GuildMember, TextChannel, Permissions } from "discord.js";
import { pool } from "../Structures/Database/Mongo.js";
import { formatDate } from "../lib/Utility/Date.js";
import { Logger } from "../Structures/Logger.js";
import { GuildSettings } from "../lib/types/Collections";
import { Command } from '../Structures/Command.js';

const Embed = Command.Embed;

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

export default class implements Event {
    name: keyof ClientEvents = 'guildMemberRemove';
    logger = new Logger(this.name);

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
        if(!server?.welcomeChannel) {
            return;
        }

        let channel: TextChannel;
        try {
            // TextChannel logic is handled where the user sets the channel
            channel = await member.guild.client.channels.fetch(server.welcomeChannel) as TextChannel;
        } catch(e) {
            this.logger.log(e);
            return;
        }

        if(!channel.permissionsFor(member.guild.me).has(basic)) {
            return;
        }

        const embed = Embed.success()
            .setAuthor(member.user.username, member.user.displayAvatarURL())
            .setDescription(`${member} (${member.user.tag}) has left the server!`);

        return channel.send(embed);
    }
}