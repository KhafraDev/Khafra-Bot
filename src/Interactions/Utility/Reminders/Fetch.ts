import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { kReminder } from '#khaf/types/KhafraBot.js';
import { chunkSafe } from '#khaf/utility/Array.js';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ellipsis } from '#khaf/utility/String.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { ActionRow, inlineCode, time, type Embed as MessageEmbed } from '@khaf/builders';
import { InteractionType } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, InteractionCollector, MessageComponentInteraction } from 'discord.js';

type Row = Exclude<kReminder, 'userId'>;

const inRange = Range({ min: 1, max: 20 });

const chunkEmbeds = (rows: Row[]): MessageEmbed[] => {
    const embeds = rows.map(row => {
        const repeats = row.once ? `does not repeat` : 'repeats';
        return `• ${inlineCode(row.id)}: ${time(row.time)} - ${ellipsis(inlineCode(row.message), 20)}, ${repeats}`
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

    async handle (interaction: ChatInputCommandInteraction): Promise<string | MessageEmbed | undefined> {
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

        const embeds = chunkEmbeds(rows);
        let page = 0;

        if (embeds.length === 1 || interaction.inRawGuild()) {
            return embeds[0];
        }

        const [err, int] = await dontThrow(interaction.editReply({
            content: `Page ${page + 1} out of ${embeds.length}`,
            embeds: [embeds[page]],
            components: [
                new ActionRow().addComponents(
                    Components.approve('Next', 'next').setEmoji({ name: '▶️' }),
                    Components.deny('Stop', 'stop').setEmoji({ name: '🗑️' }),
                    Components.secondary('Back', 'back').setEmoji({ name: '◀️' })
                )
            ]
        }));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        }

        const collector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            idle: 30_000,
            max: 10,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id
        });

        collector.on('collect', (i) => {
            if (i.customId === 'stop') {
                return collector.stop();
            }

            i.customId === 'next' ? page++ : page--;

            if (page < 0) page = embeds.length - 1;
            if (page >= embeds.length) page = 0;

            return void dontThrow(i.update({
                content: `Page ${page + 1} out of ${embeds.length}`,
                embeds: [embeds[page]]
            }));
        });

        collector.once('end', () => {
            return void dontThrow(interaction.editReply({ components: [] }));
        });
    }
}