import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { ellipsis } from '#khaf/utility/String.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { inlineCode, time as formatTime } from '@khaf/builders';
import { ChatInputCommandInteraction } from 'discord.js';

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'reminders',
            name: 'create'
        });
    }

    async handle (interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('message', true);
        const time = interaction.options.getString('time', true);
        const once = !interaction.options.getBoolean('repeat');

        const parsedTime = parseStrToMs(time);

        if (parsedTime === null) {
            return `❌ Invalid amount of time provided!`;
        } else if (parsedTime < 60 * 1000 * 15) {
            return `❌ The shortest reminder you can set is 15 minutes.`;
        } else if (parsedTime > 60 * 1000 * 60 * 24 * 7 * 4) {
            return `❌ The longest reminder you can set is 4 weeks.`;
        }

        const date = new Date(Date.now() + parsedTime);
        const rows = await sql<{ id: string }[]>`
            INSERT INTO "kbReminders" (
                "userId", "message", "time", "once", "interval"
            ) VALUES (
                ${interaction.user.id}::text,
                ${text},
                ${date}::timestamp,
                ${once}::boolean,
                ${parsedTime} * '1 millisecond'::interval
            ) RETURNING id;
        `;

        const intervalMessage = once ? '' : ` (Interval ${formatTime(Math.floor(parsedTime / 1000), 'R')})`;
        return stripIndents`
        ✅ Set a reminder for you!

        • Message: ${inlineCode(ellipsis(text, 100))}
        • Time: ${formatTime(date)}${intervalMessage}
        • ID: ${inlineCode(rows[0].id)}
        • Repeat: ${!once}
        `;
    }
}