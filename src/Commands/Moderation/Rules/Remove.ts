import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { pool } from '../../../Structures/Database/Mongo.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Remove a rule from the server.',
                '[number]',
                '6'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'remove',
                aliases: [ 'removerules', 'removerule', 'delete', 'deleterule', 'deleterules' ],
                folder: 'Rules',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms(true));
        } else if(!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return message.channel.send(this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `));
        } else if(!isValidNumber(+args[0]) || +args[0] < 1 || +args[1] > settings.rules.rules.length) {
            return message.channel.send(this.Embed.generic());
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

        return message.channel.send(this.Embed.success(`Removed rule #${num}!`));
    }
}