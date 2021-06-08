import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { table } from '../../../lib/Utility/CLITable.js';
import { formatDate } from '../../../lib/Utility/Date.js';

interface Insights {
    k_date: Date
    k_left: number 
    k_joined: number
}

const TWO_WEEKS = 8.64e7 * 14;

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
            WHERE k_guild_id = $1::text;
        `, [message.guild.id]);

        if (rows.length === 0)
            return this.Embed.fail(`No insights available within the last 14 days.`);

        const date = new Date();
        const now = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const r = rows.filter(r => (now - r.k_date.getTime()) <= TWO_WEEKS);

        const t = table({
            Dates: r.map(row => formatDate('MMMM Do, YYYY', row.k_date)),
            Joins: r.map(row => row.k_joined.toLocaleString(message.guild.preferredLocale)),
            Leaves: r.map(row => row.k_left.toLocaleString(message.guild.preferredLocale))
        });

        return this.Embed.success(`\`\`\`${t}\`\`\``);
    }
}