import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { type Giveaway } from '#khaf/types/KhafraBot.js';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { plural } from '#khaf/utility/String.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { ActionRow, bold, inlineCode, time } from '@discordjs/builders';
import { ChatInputCommandInteraction, InteractionReplyOptions, NewsChannel, TextChannel } from 'discord.js';

type GiveawayId = Pick<Giveaway, 'id'>;

const timeRange = Range({ min: 60 * 1000, max: 60 * 1000 * 60 * 24 * 30, inclusive: true });

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'giveaway',
            name: 'create'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string | InteractionReplyOptions> {
        const channel = interaction.options.getChannel('channel', true) as TextChannel | NewsChannel;
        const prize = interaction.options.getString('prize', true);
        const ends = parseStrToMs(interaction.options.getString('ends', true));
        const winners = interaction.options.getInteger('winners') ?? 1;

        if (!timeRange(ends)) {
            return '❌ A giveaway must last longer than a minute, and less than a month!';
        }

        const endsDate = new Date(Date.now() + ends);

        const [sentError, sent] = await dontThrow(channel.send({
            embeds: [
                Embed.ok()
                    .setTitle('A giveaway is starting!')
                    .setDescription(`
                    ${prize.slice(0, 1950)}
                    
                    ${bold('React with 🎉 to enter!')}
                    `)
                    .setFooter({ text: `${winners} winner${plural(winners)}` })
                    .setTimestamp(endsDate)
            ]
        }));

        if (sentError !== null) {
            return `❌ An unexpected error occurred trying to send a message in this channel: ${inlineCode(sentError.message)}`;
        } else {
            void dontThrow(sent.react('🎉'));
        }

        const rows = await sql<GiveawayId[]>`
            INSERT INTO kbGiveaways (
                guildId, 
                messageId,
                channelId,
                initiator,
                endDate,
                prize,
                winners
            ) VALUES (
                ${interaction.guildId}::text, 
                ${sent.id}::text, 
                ${channel.id}::text,
                ${interaction.user.id}::text,
                ${endsDate}::timestamp,
                ${prize},
                ${winners}::smallint
            ) ON CONFLICT DO NOTHING
            RETURNING id;
        `;

        return {
            content: stripIndents`
            ✅ Started a giveaway in ${channel}!
    
            • ${winners} winner${plural(winners)}
            • Ends ${time(endsDate)}
            • ID ${inlineCode(rows[0].id)}`,
            components: [
                new ActionRow().addComponents(
                    Components.link('Message Link', sent.url)
                )
            ]
        } as InteractionReplyOptions;
    }
}