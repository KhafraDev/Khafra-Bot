import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { ellipsis } from '#khaf/utility/String.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { inlineCode, time as formatTime } from '@khaf/builders';
import { ChatInputCommandInteraction } from 'discord.js';

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'reminders',
            name: 'edit'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        const id = interaction.options.getString('id', true);

        if (!uuidRegex.test(id)) {
            return `❌ An invalid ID was provided!`;
        }

        const text = interaction.options.getString('message');
        const time = interaction.options.getString('time');
        const once = interaction.options.getBoolean('repeat');

        const parsedTime = time ? parseStrToMs(time) : null;

        if (parsedTime && parsedTime < 60 * 1000 * 15) {
            return `❌ The shortest reminder you can set is 15 minutes.`;
        } else if (parsedTime && parsedTime > 60 * 1000 * 60 * 24 * 7 * 4) {
            return `❌ The longest reminder you can set is 4 weeks.`;
        }

        const date = parsedTime ? new Date(Date.now() + parsedTime) : null;
        
        const rows = await sql<{ id: string }[]>`
            UPDATE "kbReminders" SET
                "message" = COALESCE(NULLIF(${text}::text, NULL), "kbReminders"."message"),
                "time" = COALESCE(NULLIF(${date}::timestamp, NULL), "kbReminders"."time"),
                "once" = COALESCE(NULLIF(${typeof once === 'boolean' ? !once : null}::boolean, NULL), "kbReminders"."once") 
            WHERE
                "id" = ${id}::uuid AND
                "userId" = ${interaction.user.id}::text
            ;
        `;

        if (rows.length === 0) {
            return `❌ You do not have any reminders with that ID.`;
        }

        const intervalMessage = once ? '' : parsedTime
            ? ` (Interval ${formatTime(Math.floor(parsedTime / 1000), 'R')})`
            : '';
        const updatedFields: string[] = [];

        if (text) updatedFields.push(`• Message: ${inlineCode(ellipsis(text, 100))}`);
        if (date) updatedFields.push(`• Time: ${formatTime(date)}${intervalMessage}`);
        if (once !== null) updatedFields.push(`• Repeat: ${once}`);

        return stripIndents`
        ✅ Edited a reminder for you!

        ID: ${inlineCode(id)}
        ${updatedFields.join('\n')}
        `;
    }
}