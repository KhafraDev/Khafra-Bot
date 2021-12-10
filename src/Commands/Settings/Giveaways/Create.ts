import { bold, inlineCode } from '@khaf/builders';
import {
    Channel, MessageActionRow,
    NewsChannel,
    Permissions,
    TextChannel
} from 'discord.js';
import { isText, Message } from '../../../lib/types/Discord.js.js';
import { Giveaway } from '../../../lib/types/KhafraBot.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { parseStrToMs } from '../../../lib/Utility/ms.js';
import { hasPerms, permResolvableToString } from '../../../lib/Utility/Permissions.js';
import { plural } from '../../../lib/Utility/String.js';
import { Range } from '../../../lib/Utility/Valid/Number.js';
import { Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Postgres.js';

type GiveawayId = Pick<Giveaway, 'id'>;

interface GiveawaySettings {
    endDate: Date | null
    prize: string | null
    winners: number
    channel: TextChannel | NewsChannel | null
}

const description = 
    `Welcome to Khafra-Bot's giveaway creator. There are a few settings ` +
    `that you may wish to tweak, so we're going to go through the list. ` +
    `Follow the instructions and it'll be done quickly. :) \n\n`;

const winnersRange = Range({ min: 1, max: 100, inclusive: true });
const monthMs = 60 * 1000 * 60 * 24 * 30;
const perms = new Permissions([
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.VIEW_CHANNEL
]);

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Giveaway: create a giveaway that ends after a given time!'
            ],
			{
                name: 'giveaway:create',
                folder: 'Giveaways',
                aliases: ['giveaways:create'],
                args: [0, 0],
                guildOnly: true,
                permissions: [
                    Permissions.FLAGS.READ_MESSAGE_HISTORY
                ]
            }
        );
    }

    async init(message: Message) {
        // TODO(@KhafraDev): wtf perms should this be available for?
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.perms(
                message.channel as TextChannel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        }

        const settings: GiveawaySettings = {
            channel: null,
            endDate: null,
            prize: null,
            winners: 1,
        };

        const m = await message.channel.send({
            embeds: [
                this.Embed.ok(`${description}${bold('Enter the channel where the giveaway should be hosted.')}`)
            ]
        });

        { // set the channel where the giveaway will occur
            const channelSetting = await message.channel.awaitMessages({
                max: 1,
                time: 60 * 1000 * 5,
                filter: (m) =>
                    m.author.id === message.author.id &&
                    m.content.length > 0
            });

            if (channelSetting.size === 0) {
                return void m.edit({
                    embeds: [this.Embed.error(`Didn't respond in time, giveaway canceled.`)]
                });
            }

            const msg = channelSetting.first()!;
            let channel: Channel | null = null;
            if (msg.mentions.channels.size !== 0) {
                channel = msg.mentions.channels.first() ?? null;
            } else {
                channel = await getMentions(msg, 'channels', { splice: false });
            }

            if (!isText(channel)) {
                return this.Embed.error(`${channel ?? 'Unknown channel'} isn't a text channel!`);
            } else if (!hasPerms(channel, message.guild.me, perms)) {
                return this.Embed.error(`I don't have one or more of these ${permResolvableToString(perms).join(', ')} permissions in ${channel}.`);
            }

            settings.channel = channel;

            const embed = this.Embed.ok()
                .setDescription(bold('Should there be more than 1 winner?'));

            await m.edit({ 
                embeds: [embed],
                components: [
                    new MessageActionRow().addComponents(
                        Components.approve('Yes', 'winners'),
                        Components.deny('No', 'deny')
                    )
                ]
            });
        }

        { // handle # of winners
            const [moreWinnersError, moreWinnersInteraction] = await dontThrow(m.awaitMessageComponent({
                time: 20_000,
                filter: (interaction) =>
                    interaction.user.id === message.author.id &&
                    ['winners', 'deny'].includes(interaction.customId)
            }));

            if (moreWinnersError !== null) {
                return void m.edit({
                    embeds: [
                        this.Embed.error('No response within 20 seconds, giveaway canceled.')
                    ],
                    components: disableAll(m)
                });
            }

            // user wants multiple winners
            if (moreWinnersInteraction.customId === 'winners') {
                await m.edit({
                    embeds: [
                        this.Embed.ok(bold('How many winners should there be?'))
                    ],
                    components: []
                });

                const w = await message.channel.awaitMessages({
                    max: 1,
                    time: 20_000,
                    filter: (m) => 
                        m.author.id === message.author.id &&
                        winnersRange(Number(m.content))
                });

                if (w.size === 0) {
                    return void m.edit({
                        embeds: [this.Embed.error(`Didn't respond in time, giveaway canceled.`)]
                    });
                }

                settings.winners = Number(w.first()!.content);
            }

            const embed = this.Embed.ok()
                .setDescription(bold('What should the prize be? (5 minutes)'));

            await m.edit({
                embeds: [embed],
                components: []
            });
        }

        { // handle setting the prize
            const prize = await message.channel.awaitMessages({
                max: 1,
                time: 60 * 1000 * 5,
                filter: (m) =>
                    m.author.id === message.author.id &&
                    m.content.length > 0
            });

            if (prize.size === 0) {
                return void m.edit({
                    embeds: [this.Embed.error(`Didn't respond in time, giveaway canceled.`)]
                });
            }

            settings.prize = prize.first()!.content;

            const embed = m.embeds[0]
                .setDescription(`
                ${bold('When should the giveaway end?')}
                
                Valid formats are similar but not limited to ${inlineCode(`1h 30m`)} and ${inlineCode(`2w 3d 1h`)}.
                A giveaway must be at least 1 minute long and end within 1 month.
                `);

            await m.edit({ embeds: [embed] });
        }

        { // handle end date
            let endStr: number | null = null;
            const end = await message.channel.awaitMessages({
                max: 1,
                time: 30_000,
                filter: (m) =>
                    m.author.id === message.author.id &&
                    (endStr = parseStrToMs(m.content)) !== null &&
                    endStr >= 0 && // not negative
                    endStr >= 1000 * 60 && // longer than 1 minute
                    endStr <= monthMs // less than a month
            });

            if (end.size === 0) {
                return void m.edit({
                    embeds: [this.Embed.error(`Didn't respond with a valid time, giveaway canceled.`)]
                });
            }

            settings.endDate = new Date(Date.now() + endStr!);
        }

        const sent = await settings.channel.send({
            embeds: [
                this.Embed.ok()
                    .setTitle(`A giveaway is starting!`)
                    .setDescription(`
                    ${settings.prize}
                    
                    ${bold('React with 🎉 to enter!')}
                    `)
                    .setFooter(`${settings.winners} winner${plural(settings.winners)}`)
                    .setTimestamp(settings.endDate)
            ]
        });

        void sent.react('🎉');

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
            message.guild.id, 
            sent.id,
            settings.channel.id,
            message.member.id, 
            settings.endDate, 
            settings.prize, 
            settings.winners
        ]);

        await m.edit({
            embeds: [
                this.Embed.ok(`
                Started a giveaway in ${settings.channel}.

                ID: ${inlineCode(rows[0].id)}
                `)
                .setFooter('Ends on')
                .setTimestamp(settings.endDate)
            ]
        });
    }
}