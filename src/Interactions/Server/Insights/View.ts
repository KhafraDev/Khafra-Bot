import { pool } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { table } from '#khaf/utility/CLITable.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { codeBlock } from '@khaf/builders';
import { CommandInteraction } from 'discord.js';

interface Insights {
    k_date: Date
    k_left: number 
    k_joined: number
}

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'insights',
            name: 'view'
        });
    }

    async handle (interaction: CommandInteraction) {
        const id = interaction.guildId ?? interaction.guild?.id;

        if (!id) {
            return `❌ Re-invite the bot with the correct permissions to use this command!`;
        }

        const { rows } = await pool.query<Insights>(`
            WITH removed AS (
                DELETE FROM kbInsights
                WHERE k_date <= CURRENT_DATE - 14 AND k_guild_id = $1::text
            )

            SELECT k_date, k_left, k_joined
            FROM kbInsights
            WHERE 
                k_guild_id = $1::text AND
                k_date > CURRENT_DATE - 14 AND
                k_date < CURRENT_DATE
            ORDER BY kbInsights.k_date ASC;
        `, [id]);

        if (rows.length === 0) {
            return `❌ There are no insights available for the last 14 days!`;
        }

        const locale = interaction.guild?.preferredLocale ?? 'en-US';
        const intl = Intl.DateTimeFormat(locale, { dateStyle: 'long' });

        const { Dates, Joins, Leaves } = rows.reduce((red, row) => {
            red.Dates.push(intl.format(row.k_date));
            red.Joins.push(row.k_joined.toLocaleString(locale));
            red.Leaves.push(row.k_left.toLocaleString(locale));

            return red;
        }, {
            Dates: [] as string[],
            Joins: [] as string[],
            Leaves: [] as string[]
        });

        const t = table({ Dates, Joins, Leaves });

        return Embed.ok().setDescription(codeBlock(t));
    }
}