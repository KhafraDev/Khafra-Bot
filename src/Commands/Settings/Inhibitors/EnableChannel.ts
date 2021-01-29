import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Enable commands to be used in a given channel (administrators bypass this inhibitor).',
                '#bot-commands'
            ],
			{
                name: 'enablechannel',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: [ 'whitelistchannel', 'allowchannel' ]
            }
        );
    }

    async init(message: Message, _args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        const channel = await getMentions(message, 'channels');
        if(!channel) {
            return message.reply(this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `));
        } else if(!isText(channel)) {
            return message.reply(this.Embed.fail('Channel isn\'t a text/news channel.'));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const has = settings?.enabledGuild?.some(c => c.type === 'channel' && c.id === channel.id);
        if(has) {
            await collection.updateOne(
                { id: message.guild.id },
                { $pull: {
                    enabledGuild: {
                        type: 'channel',
                        id: channel.id
                    }
                } }
            );

            return message.reply(this.Embed.success(`
            Commands have been un-whitelisted in ${channel}.
            `));
        }

        await collection.updateOne(
            { id: message.guild.id },
            { $push: {
                enabledGuild: {
                    type: 'channel',
                    id: channel.id
                }
            } }
        );

        return message.reply(this.Embed.success(`
        Commands have been whitelisted in ${channel}.
        `));
    }
}