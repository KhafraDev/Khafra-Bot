import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { createRequire } from 'module';
import { pool } from '../../../Structures/Database/Mongo.js';

const { prefix: defPrefix } = createRequire(import.meta.url)('../../../../config.json');

export default class extends Command {
    constructor() {
        super(
            [
                'Edit a pre-existing rule.',
                '[number] [new content]',
                '6 After 3 warnings you will be kicked now, rather than the old 4 points.'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'edit',
                aliases: [ 'editrules', 'editrule' ],
                folder: 'Rules',
                args: [2],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } else if(!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return message.reply(this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `));
        } else if(!isValidNumber(+args[0]) || +args[0] < 1 || +args[1] > settings.rules.rules.length + 1) {
            return message.reply(this.Embed.generic());
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

        return message.reply(this.Embed.success(`Edited rule #${num}!`));
    }
}