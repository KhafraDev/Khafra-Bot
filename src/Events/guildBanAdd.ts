import { Event } from "../Structures/Event";
import { ClientEvents, Guild, User, TextChannel, Permissions } from "discord.js";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";
import { Logger } from "../Structures/Logger";
import { inspect } from "util";
import { Command } from '../Structures/Command';

const Embed = Command.Embed;

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

export default class implements Event {
    name: keyof ClientEvents = 'guildBanAdd';
    logger = new Logger(this.name);

    async init(guild: Guild, user: User) {        
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
            
        if(user.partial) {
            await user.fetch();
        }

        const server = await collection.findOne({ id: guild.id }) as GuildSettings;
        if(!server.welcomeChannel) {
            return;
        }

        let channel: TextChannel;
        try {
            // TextChannel logic is handled where the user sets the channel
            channel = await guild.client.channels.fetch(server.welcomeChannel) as TextChannel;
        } catch(e) {
            this.logger.log(inspect(e));
            return;
        }

        if(!channel.permissionsFor(guild.me).has(basic)) {
            return;
        }

        const embed = Embed.success()
            .setAuthor(user.username, user.displayAvatarURL())
            .setTitle(`${user} (${user.tag}) was banned!`);

        return channel.send(embed);
    }
}