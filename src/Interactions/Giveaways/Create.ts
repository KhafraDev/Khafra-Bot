import { bold, hyperlink, inlineCode, time } from '@khaf/builders';
import { CommandInteraction, NewsChannel, TextChannel } from 'discord.js';
import { type Giveaway } from '../../lib/types/KhafraBot.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { parseStrToMs } from '../../lib/Utility/ms.js';
import { plural } from '../../lib/Utility/String.js';
import { Range } from '../../lib/Utility/Valid/Number.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { InteractionSubCommand } from '../../Structures/Interaction.js';

type GiveawayId = Pick<Giveaway, 'id'>;

const winnersRange = Range({ min: 1, max: 100, inclusive: true });
const timeRange = Range({ min: 60 * 1000, max: 60 * 1000 * 60 * 24 * 30, inclusive: true });

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'giveaway',
            name: 'create'
        });
    }

    async handle (interaction: CommandInteraction) {
        const channel = interaction.options.getChannel('channel', true) as TextChannel | NewsChannel;
        const prize = interaction.options.getString('prize', true);
        const ends = parseStrToMs(interaction.options.getString('ends', true));
        const winners = interaction.options.getInteger('winners') ?? 1;
        
        if (!winnersRange(winners)) {
            return `❌ The number of winners must be between 1 and 100!`;
        } else if (ends === null || !timeRange(ends)) {
            return `❌ A giveaway must last longer than a minute, and less than a month!`;
        }

        const endsDate = new Date(Date.now() + ends);

        const [sentError, sent] = await dontThrow(channel.send({
            embeds: [
                Embed.ok()
                    .setTitle(`A giveaway is starting!`)
                    .setDescription(`
                    ${prize.slice(0, 1950)}
                    
                    ${bold('React with 🎉 to enter!')}
                    `)
                    .setFooter(`${winners} winner${plural(winners)}`)
                    .setTimestamp(endsDate)
            ]
        }));

        if (sentError !== null) {
            return `❌ An unexpected error occurred trying to send a message in this channel: ${inlineCode(sentError.message)}`;
        } else {
            void dontThrow(sent.react('🎉'));
        }

        const { rows } = await pool.query<GiveawayId>(`
            INSERT INTO kbGiveaways (
                guildId, 
                messageId,
                channelId,
                initiator,
                endDate,
                prize,
                winners
            ) VALUES (
                $1::text, 
                $2::text, 
                $3::text,
                $4::text,
                $5::timestamp,
                $6::text,
                $7::smallint
            ) ON CONFLICT DO NOTHING
            RETURNING id;
        `, [
            interaction.guildId,
            sent.id,
            channel.id,
            interaction.user.id,
            endsDate,
            prize,
            winners
        ]);

        return `
        ✅ Started a giveaway in ${channel}!

        • ${winners} winner${plural(winners)}
        • Ends ${time(endsDate)}
        • ID ${inlineCode(rows[0].id)}
        • ${hyperlink('Giveaway Message', sent.url)}
        `;
    }
}