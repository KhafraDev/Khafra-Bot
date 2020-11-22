import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { pool } from '../../../Structures/Database/Mongo.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Clear all rules from the server.',
                ''
            ],
            [ /* No extra perms needed */ ],
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
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } else if(!settings || !('rules' in settings) || settings.rules.rules?.length) {
            return message.reply(this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        await collection.updateOne(
            { id: message.guild.id },
            { $unset: {
                'rules.rules': ''
            } }
        );

        return message.reply(this.Embed.success(`
        Cleared ${settings.rules.rules.length} rules!
        `));
    }
}