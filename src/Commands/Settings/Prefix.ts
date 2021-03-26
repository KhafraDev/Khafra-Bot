import { Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Change the prefix for the current guild.',
                '>>', '!!', '?'
            ],
			{
                name: 'prefix',
                folder: 'Settings',
                args: [1, 1],
                ratelimit: 10,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        }

        // TODO: remove
        if (args[0].replace(/[A-z0-9]/g, '').length !== args[0].length) {
            return this.Embed.fail(`
            Only non-alphanumeric characters are allowed!
            `);
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const updated = await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                prefix: args[0]
            } },
            { upsert: true }
        );

        if (updated.upsertedCount === 1 || updated.modifiedCount === 1) {
            return this.Embed.success(`
            Changed prefix to \`\`${args[0]}\`\`!
            `);
        } else {
            return this.Embed.fail(`
            An unexpected error occurred!
            `);
        }
    }
}