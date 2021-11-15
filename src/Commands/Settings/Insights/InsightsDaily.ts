import { codeBlock } from '@khaf/builders';
import { MessageAttachment, Permissions, ReplyMessageOptions } from 'discord.js';
import { fetch } from 'undici';
import { URLSearchParams } from 'url';
import { Message } from '../../../lib/types/Discord.js.js';
import { table } from '../../../lib/Utility/CLITable.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

class ImageCharts {
    private query = new URLSearchParams();

    constructor(o: Record<string, string | number>) {
        for (const [key, value] of Object.entries(o)) {
            this.query.set(key, `${value}`);
        }
    }

    async toBuffer() {
        const res = await fetch(`https://image-charts.com/chart.js/2.8.0?${this.query}`, {
            headers: {
                'User-Agent': 'PseudoBot'
            }
        });
        
        return Buffer.from(await res.arrayBuffer());
    }
}

interface Insights {
    k_date: Date
    k_left: number 
    k_joined: number
}

const intl = Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

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

        const t = table({ Dates, Joins, Leaves });
        const chart = await new ImageCharts({
            chart: data,
            width: 500,
            height: 300,
            backgroundColor: 'black'
        }).toBuffer();
        const attach = new MessageAttachment(chart, `chart.png`);

        return {
            embeds: [
                this.Embed.success()
                    .setDescription(codeBlock(t))
                    .setImage(`attachment://chart.png`)
            ],
            files: [attach]
        } as ReplyMessageOptions;
    }
}