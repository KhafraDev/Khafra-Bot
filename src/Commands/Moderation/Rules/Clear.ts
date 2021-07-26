import { Command } from '../../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Message } from '../../../lib/types/Discord.js.js';

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

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);

        const { rows } = await pool.query(`
            DELETE FROM kbRules
            WHERE kbRules.k_guild_id = $1::text;
        `, [message.guild.id]);

        return this.Embed.success(`Deleted all ${rows.length} rules!`);
    }
}