import { Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the mod action log channel.',
                '#channel',
                '772957951941673000'
            ],
			{
                name: 'actionchannel',
                aliases: [ 'modlog', 'modlogs' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!channel || !isText(channel)) {
            return this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `);
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.findOneAndUpdate(
            { id: message.guild.id },
            {
                $set: {
                    modActionLogChannel: channel.id
                }
            },
            { upsert: true }
        );

        return this.Embed.success(`
        Set public mod-logging channel to ${channel}!
        `);
    }
}