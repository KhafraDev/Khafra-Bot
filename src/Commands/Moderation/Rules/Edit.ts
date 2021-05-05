import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import config from '../../../../config.json';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Range } from '../../../lib/Utility/Range.js';

const { prefix: defPrefix } = config;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Edit a pre-existing rule.',
                '[number] [new content]',
                '6 After 3 warnings you will be kicked now, rather than the old 4 points.'
            ],
			{
                name: 'edit',
                aliases: [ 'editrules', 'editrule' ],
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
        } else if (
            !validateNumber(Number(args[0])) || 
            !Range(1, settings.rules.rules.length, true).isInRange(Number(args[1]))
        ) {
            return this.Embed.generic(this);
        }

        // This is needed so the message doesn't lose its formatting (new lines, etc.)
        const prefix: string = settings?.prefix ?? defPrefix;
        const split = message.content.split(/\s+/g);
        const command = split.shift().slice(prefix.length).toLowerCase();
        const num = Number(split.shift());
        const content = message.content.replace(new RegExp(`^${prefix}${command} ${num} `, 'i'), '');

        settings.rules.rules[num - 1] = { index: num, rule: content };

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                rules: { channel: settings.rules.channel, rules: settings.rules.rules }
            } }
        );

        return this.Embed.success(`Edited rule #${num}!`);
    }
}