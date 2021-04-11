import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Remove a rule from the server.',
                '[number]',
                '6'
            ],
			{
                name: 'remove',
                aliases: [ 'removerules', 'removerule', 'delete', 'deleterule', 'deleterules' ],
                folder: 'Rules',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } else if (!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `);
        } else if (!isValidNumber(+args[0]) || +args[0] < 1 || +args[1] > settings.rules.rules.length) {
            return this.Embed.generic(this);
        }

        const num = Number(args[0]);
        settings.rules.rules.splice(num - 1, 1);
        settings.rules.rules.slice(num - 1).map(r => r.index = r.index - 1);

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                rules: { channel: settings.rules.channel, rules: settings.rules.rules }
            } }
        );

        return this.Embed.success(`Removed rule #${num}!`);
    }
}