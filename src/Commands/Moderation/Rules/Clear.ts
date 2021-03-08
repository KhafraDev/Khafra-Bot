import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Clear all rules from the server.'
            ],
			{
                name: 'removeall', // clear is already a command
                aliases: [ 'deleteall', 'clearrules', 'clearrule', 'clearrule', 'clearrules' ],
                folder: 'Rules',
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message, _args: string[], settings: GuildSettings) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } else if (!settings || !('rules' in settings) || settings.rules.rules?.length) {
            return this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `);
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $unset: {
                'rules.rules': ''
            } }
        );

        return this.Embed.success(`
        Cleared ${settings.rules.rules.length} rules!
        `);
    }
}