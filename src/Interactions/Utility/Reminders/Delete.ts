import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { bold } from '@discordjs/builders';
import { plural } from '#khaf/utility/String.js';

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'reminders',
            name: 'delete'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const id = interaction.options.getString('id', true);
        const idList = id.includes(',')
            ? id.split(/[ ,]+/g).filter(v => uuidRegex.test(v))
            : [id.trim()].filter(v => uuidRegex.test(v));

        if (idList.length === 0) {
            return {
                content: '❌ No UUIDs provided were valid, try again!',
                ephemeral: true
            }
        }

        const rows = await sql`
            DELETE FROM "kbReminders"
            WHERE 
                "id" = ANY(ARRAY[${sql.array(idList)}]::uuid[]) AND
                "userId" = ${interaction.user.id}::text
            RETURNING "id";
        `;

        return {
            content: `✅ Deleted ${bold(`${rows.count}`)} row${plural(rows.count)}!`,
            ephemeral: true
        }
    }
}