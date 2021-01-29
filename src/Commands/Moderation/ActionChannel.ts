import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { _getMentions } from '../../lib/Utility/Mentions.js';
import { isText } from '../../lib/types/Discord.js.js';

export default class extends Command {
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
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } 

        const channel = await _getMentions(message, 'channels') ?? message.channel;
        if(!channel || !isText(channel)) {
            this.logger.log(`Channel: ${channel}`);
            return message.reply(this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `));
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

        return message.reply(this.Embed.success(`
        Set public mod-logging channel to ${channel}!
        `));
    }
}