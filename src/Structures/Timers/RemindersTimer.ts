import { client } from '#khaf/Client';
import { sql } from '#khaf/database/Postgres.js';
import { logger } from '#khaf/Logger';
import { Timer } from '#khaf/Timer';
import { kReminder } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { time } from '@khaf/builders';
import { setInterval } from 'timers';

export class RemindersTimer extends Timer {
    constructor () {
        super({ interval: 30 * 1000 });
    }

    setInterval (): NodeJS.Timer {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const interval = setInterval(async () => {
            const rows = await sql<kReminder[]>`
                WITH deleted AS (
                    DELETE FROM "kbReminders"
                    WHERE 
                        "time" < CURRENT_TIMESTAMP AND
                        "once" = TRUE
                    RETURNING *
                ), updated AS (
                    UPDATE "kbReminders"
                    SET "time" = "time" + "kbReminders"."interval"
                    WHERE
                        "time" < CURRENT_TIMESTAMP AND
                        "once" = FALSE
                    RETURNING *
                )
            
                SELECT * FROM deleted
            
                UNION ALL
            
                SELECT * FROM updated;
            `;

            for (const row of rows) {
                void this.action(row);
            }
        }, this.options.interval);

        return interval;
    }

    async action (reminder: kReminder): Promise<void> {
        try {
            const user = await client.users.fetch(reminder.userId);

            const willRemind = reminder.once ? '' : `\n\nWill repeat at ${time(reminder.time)}!`;
            const remind = Embed.ok()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .setDescription(`${reminder.message}${willRemind}`);

            await user.send({ embeds: [remind] });
        } catch (e) {
            logger.error(e);
        }
    }
}