import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the channel to post rules to.',
                '#rules',
                '705894556205580499'
            ],
			{
                name: 'change',
                aliases: [ 'changechannel', 'rulechannel' ],
                folder: 'Rules',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, _args: string[], settings: GuildSettings) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } else if (!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `);
        }

        const channel = await getMentions(message, 'channels');
        if (!isText(channel)) {
            return this.Embed.fail(`Not a text channel.`);
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                'rules.channel': channel.id
            } }
        );

        return this.Embed.success(`
        The rules will now be posted to ${channel}!
        `);
    }
}