import { Command } from "../../Structures/Command";
import { 
    Message, TextChannel, Permissions
} from "discord.js";

import { pool } from "../../Structures/Database/Mongo";
import { inspect } from "util";

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

export default class extends Command {
    constructor() {
        super(
            [
                'Set the welcome channel for messages when a user leaves, joins, or is kicked from the guild!',
                '#general', '705896428287033375'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'welcome',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: [ 'welcomechannel' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms.call(this, true));
        } 

        let channel: TextChannel;
        try {
            channel = message.mentions.channels.first() ?? await message.client.channels.fetch(args[0]) as TextChannel;
        } catch(e) {
            this.logger.log(inspect(e));
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }

        if(channel.type !== 'text') {
            return message.channel.send(this.Embed.fail(`${channel} is not a text channel!`));
        } else if(!channel.permissionsFor(message.guild.me).has(basic)) {
            return message.channel.send(this.Embed.fail(`
            I am missing one or more of ${basic.toArray().map(p => `\`\`${p}\`\``).join(', ')} permissions!
            `));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const updated = await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                welcomeChannel: channel.id
            } },
            { upsert: true }
        );
        
        if(updated.modifiedCount === 1 || updated.upsertedCount === 1) {
            return message.channel.send(this.Embed.success(`
            You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
            `));
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}