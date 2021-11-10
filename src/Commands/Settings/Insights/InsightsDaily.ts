import { Command } from '../../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { table } from '../../../lib/Utility/CLITable.js';
import { Message } from '../../../lib/types/Discord.js.js';
import { codeBlock } from '@khaf/builders';

interface Insights {
    k_date: Date
    k_left: number 
    k_joined: number
}

const intl = Intl.DateTimeFormat('en-US', { dateStyle: 'long' });
const dateFormat = (time: Date) => intl.format(time);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Insights: get a list of the number of people who have left and joined the server over the span of a few weeks.'
            ],
			{
                name: 'insights',
                folder: 'Insights',
                aliases: [ 'insight' ],
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.VIEW_GUILD_INSIGHTS)) {
            return this.Embed.missing_perms(true);
        }

        const { rows } = await pool.query<Insights>(`
            WITH removed AS (
                DELETE FROM kbInsights
                WHERE k_date < CURRENT_DATE - 14 AND k_guild_id = $1::text
            )

            SELECT k_date, k_left, k_joined
            FROM kbInsights
            WHERE 
                k_guild_id = $1::text AND
                k_date > CURRENT_DATE - 14
            ORDER BY kbInsights.k_date ASC;
        `, [message.guild.id]);

        if (rows.length === 0)
            return this.Embed.fail(`No insights available within the last 14 days.`);

        const locale = message.guild.preferredLocale;
        const { Dates, Joins, Leaves } = rows.reduce((red, row) => {
            red.Dates.push(dateFormat(row.k_date));
            red.Joins.push(row.k_joined.toLocaleString(locale));
            red.Leaves.push(row.k_left.toLocaleString(locale));

            return red;
        }, {
            Dates: [] as string[],
            Joins: [] as string[],
            Leaves: [] as string[]
        });

        const t = table({ Dates, Joins, Leaves });

        return this.Embed.success(codeBlock(t));
    }
}