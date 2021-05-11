import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { plural, upperCase } from '../../../lib/Utility/String.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'List all rules in a server.'
            ],
			{
                name: 'all',
                aliases: [ 'allrules', 'allrule' ],
                folder: 'Rules',
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        const { rows } = await pool.query<{ rule_id: number, rule: string }>(`
            SELECT rule_id, rule FROM kbRules
            WHERE kbRules.k_guild_id = $1::text
            ORDER BY kbRules.rule_id ASC
            FETCH FIRST 20 ROWS ONLY;
        `, [message.guild.id]);

        if (rows.length === 0)
            return this.Embed.fail('Server has no rules configured in the bot!');

        const desc = rows
            .map(({ rule, rule_id }) => `${rule_id}. \`\`${rule.slice(0, 85)}${rule.length > 85 ? '...' : ''}\`\``)
            .join('\n');

        return this.Embed.success(desc)
            .setTitle(`${upperCase(message.guild.name)}'s Rule${plural(rows.length)}`);
    }
}