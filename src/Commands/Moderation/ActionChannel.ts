import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Set the mod action log channel.',
                '#channel',
                '772957951941673000'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'actionchannel',
                aliases: [ 'modlog', 'modlogs' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } 

        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            idOrChannel = message.channel; 
        }

        const channel = message.guild.channels.resolve(idOrChannel);
        if(!channel) {
            this.logger.log(`Channel: ${channel}, ID: ${idOrChannel}`);
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