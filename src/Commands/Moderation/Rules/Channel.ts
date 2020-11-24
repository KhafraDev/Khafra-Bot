import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Set the channel to post rules to.',
                '#rules',
                '705894556205580499'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'change',
                aliases: [ 'changechannel', 'rulechannel' ],
                folder: 'Rules',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if((!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id))
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } else if(!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return message.reply(this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `));
        }

        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            return message.reply(this.Embed.fail(`Invalid channel ID provided!`));
        }

        const channel = message.guild.channels.resolve(idOrChannel);
        if(!channel) {
            return message.reply(this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `));
        } else if(!isText(channel)) {
            return message.reply(this.Embed.fail(`Not a text channel.`));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                'rules.channel': channel.id
            } }
        );

        return message.reply(this.Embed.success(`
        The rules will now be posted to ${channel}!
        `));
    }
}