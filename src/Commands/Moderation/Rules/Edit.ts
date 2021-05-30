import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Range } from '../../../lib/Utility/Range.js';
import { pool } from '../../../Structures/Database/Postgres.js';

const range = Range(1, 32767, true); // smallint

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

    async init(message: Message, { args, content }: Arguments) {
        const id = Number(args[0]);

        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);
        else if (!validateNumber(id) || !range.isInRange(id)) 
            return this.Embed.generic(this);

        // remove id
        const text = content.replace(new RegExp(`^${args[0]} `), '');
        
        const { rows } = await pool.query<{ rule_id: string }>(`
            UPDATE kbRules
            SET rule = $1::text
            WHERE rule_id = $2::smallint
            RETURNING rule_id;
        `, [text, id]);

        if (rows.length === 0)  
            return this.Embed.fail(`No rule with that ID was found, nothing was updated.`);

        return this.Embed.success(`Edited rule \`\`#${id}\`\`!`);
    }
}