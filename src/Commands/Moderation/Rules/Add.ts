import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';

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
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { content }: Arguments) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);

        await pool.query(`
            INSERT INTO kbRules (
                k_guild_id, rule
            ) VALUES (
                $1::text, $2::text
            ) ON CONFLICT DO NOTHING;
        `, [message.guild.id, content]);

        return this.Embed.success(`
        Added rule \`\`\`${content.length > 100 ? `${content.slice(0, 100)}...`: content}\`\`\` to the server!
        `);
    }
}