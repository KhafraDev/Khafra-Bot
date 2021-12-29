import { pool } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@khaf/builders';
import { CommandInteraction, MessageAttachment, ReplyMessageOptions } from 'discord.js';

interface Insights {
    k_date: Date
    k_left: number 
    k_joined: number
}

const Chart = (o: Record<string, string | number>) => {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(o)) {
        query.set(key, `${value}`);
    }

    return async () => {
        const res = await fetch(`https://image-charts.com/chart.js/2.8.0?${query}`, {
            headers: {
                'User-Agent': 'PseudoBot'
            }
        });
        
        return await res.blob();
    }
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

        const data = JSON.stringify({
            type: 'line',
            data: {
                labels: Dates,
                datasets: [
                    {
                        label: 'Joins',
                        borderColor: 'rgb(255,+99,+132)',
                        backgroundColor: 'rgba(255,+99,+132,+.5)',
                        data: Joins
                    },
                    {
                        label: 'Leaves',
                        borderColor: 'rgb(54,+162,+235)',
                        backgroundColor: 'rgba(54,+162,+235,+.5)',
                        data: Leaves
                    }
                ]
            },
        });

        const chart = Chart({
            chart: data,
            width: 500,
            height: 300,
            backgroundColor: 'black'
        });

        const [err, blob] = await dontThrow(chart());

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        }

        return {
            files: [
                new MessageAttachment(blob, `chart.png`)
            ]
        } as ReplyMessageOptions;
    }
}