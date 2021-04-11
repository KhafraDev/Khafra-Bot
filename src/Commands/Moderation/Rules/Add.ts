import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import config from '../../../../config.json';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const { prefix: defPrefix } = config;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Add a rule to the server.',
                '[number] [content]',
                '6 Rule 6 is now this, the old rule 6 is now 7 and so on.'
            ],
			{
                name: 'add',
                aliases: [ 'addrules', 'addrule' ],
                folder: 'Rules',
                args: [2],
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
        } else if (!isValidNumber(+args[0]) || +args[0] < 1 || +args[1] > settings.rules.rules.length + 1) {
            return this.Embed.generic(this);
        }

        // This is needed so the message doesn't lose its formatting (new lines, etc.)
        const prefix: string = settings?.prefix ?? defPrefix;
        const split = message.content.split(/\s+/g);
        const command = split.shift().slice(prefix.length).toLowerCase();
        const num = Number(split.shift());
        const content = message.content.replace(new RegExp(`^${prefix}${command} ${num} `, 'i'), '');

        settings.rules.rules.splice(num - 1, 0, { index: num, rule: content });
        settings.rules.rules.slice(num).map(r => r.index = r.index + 1);

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                rules: { channel: settings.rules.channel, rules: settings.rules.rules }
            } }
        );

        return this.Embed.success(`Added a new rule #${num}!`);
    }
}