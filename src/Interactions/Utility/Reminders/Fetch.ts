import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import type { kReminder } from '#khaf/types/KhafraBot.js';
import { chunkSafe } from '#khaf/utility/Array.js';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ellipsis } from '#khaf/utility/String.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { inlineCode, time } from '@discordjs/builders';
import { randomUUID } from 'node:crypto';
import type { APIEmbed } from 'discord-api-types/v10';
import { InteractionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, MessageComponentInteraction } from 'discord.js';
import { InteractionCollector } from 'discord.js';

type Row = Exclude<kReminder, 'userId'>;

const inRange = Range({ min: 1, max: 20 });

const chunkEmbeds = (rows: Row[]): APIEmbed[] => {
    if (rows.length === 0) {
        return [];
    }

    const embeds = rows.map(row => {
        const repeats = row.once ? 'does not repeat' : 'repeats';
        return `• ${inlineCode(row.id)}: ${time(row.time)} - ${inlineCode(ellipsis(row.message, 20))}, ${repeats}`
    });

    return chunkSafe(embeds, 7).map(lines => Embed.ok(lines.join('\n')));
}

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'reminders',
            name: 'fetch'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const amount = interaction.options.getInteger('amount') ?? 100;
        const trueAmount = interaction.inRawGuild()
            ? inRange(amount) ? amount : 10
            : amount;

        const rows = await sql<Row[]>`
            SELECT "id", "message", "time", "once", "interval"
            FROM "kbReminders"
            WHERE "userId" = ${interaction.user.id}::text
            LIMIT ${trueAmount}::smallint;
        `;

        const id = randomUUID();
        const embeds = chunkEmbeds(rows);
        let page = 0;

        if (embeds.length === 0) {
            return {
                content: 'You don\'t have any reminders, silly!',
                ephemeral: true
            }
        } else if (embeds.length === 1 || interaction.inRawGuild()) {
            return {
                embeds: [embeds[0]]
            }
        }

        const int = await interaction.editReply({
            content: `Page ${page + 1} out of ${embeds.length}`,
            embeds: [embeds[page]],
            components: [
                Components.actionRow([
                    Buttons.approve('Next', `next-${id}`, { emoji: { name: '▶️' } }),
                    Buttons.deny('Stop', `stop-${id}`, { emoji: { name: '🗑️' } }),
                    Buttons.secondary('Back', `back-${id}`, { emoji: { name: '◀️' } })
                ])
            ]
        });

        const collector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            idle: 30_000,
            max: 10,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id &&
                i.customId.endsWith(id)
        });

        for await (const [i] of collector) {
            if (i.customId.startsWith('stop')) {
                collector.stop();
                break;
            }

            i.customId.startsWith('next') ? page++ : page--;

            if (page < 0) page = embeds.length - 1;
            if (page >= embeds.length) page = 0;

            await i.update({
                content: `Page ${page + 1} out of ${embeds.length}`,
                embeds: [embeds[page]]
            });
        }

        await interaction.editReply({ components: disableAll(int) })
    }
}