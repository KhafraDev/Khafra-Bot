import { Arguments, Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { Range } from '../../../lib/Utility/Range.js';

interface UpdatedAndDeletedRule {
    rule_id: number
    rule: string
    new_rule_id: number
    new_rule: string
}

const range = Range(0, 32767, true); // smallint range

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
                guildOnly: true,
                ratelimit: 10
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const id = Number(args[0]);
        
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);
        else if (!validateNumber(id) || !range.isInRange(id))
            return this.Embed.fail(`An invalid rule id to delete was passed, try again.`);

        const { rows } = await pool.query<UpdatedAndDeletedRule>(`
            WITH deleted AS (
                DELETE FROM kbRules
                WHERE rule_id = $1::smallint
                RETURNING rule_id, rule
            ), updated AS (
                UPDATE kbRules
                SET rule_id = rule_id - 1
                WHERE rule_id > (SELECT rule_id FROM deleted)
                RETURNING rule_id, rule
            )

            SELECT 
                deleted.rule_id, 
                deleted.rule, 
                updated.rule_id AS new_rule_id, 
                updated.rule AS new_rule 
            FROM deleted, updated
            LIMIT 1;
        `, [id]);

        if (rows.length === 0)
            return this.Embed.fail(`Rule #${args[0]} doesn't exist, couldn't remove it.`);

        const { rule_id, rule } = rows.shift();

        return this.Embed.success(`
        Removed rule \`\`#${rule_id}\`\`
        \`\`\`${rule.length > 100 ? `${rule.slice(0, 100)}...` : rule}\`\`\`
        from the server.
        `);
    }
}