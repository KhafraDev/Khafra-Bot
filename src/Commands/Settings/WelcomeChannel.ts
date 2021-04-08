import { Command } from '../../Structures/Command.js';
import { Message, TextChannel, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the welcome channel for messages when a user leaves, joins, or is kicked from the guild!',
                '#general', '705896428287033375'
            ],
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
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = message.mentions.channels.first() ?? await message.client.channels.fetch(args[0]) as TextChannel;
        
        if (channel.type !== 'text') {
            return this.Embed.fail(`${channel} is not a text channel!`);
        } else if (!hasPerms(channel, message.guild.me, basic)) {
            return this.Embed.fail(`
            I am missing one or more of ${basic.toArray().map(p => `\`\`${p}\`\``).join(', ')} permissions!
            `);
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
        
        if (updated.modifiedCount === 1 || updated.upsertedCount === 1) {
            return this.Embed.success(`
            You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
            `);
        } else {
            return this.Embed.fail('An unexpected error occurred!');
        }
    }
}