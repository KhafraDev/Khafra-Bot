import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { Range } from '../../../lib/Utility/Range.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { plural } from '../../../lib/Utility/String.js';
import { parseStrToMs } from '../../../lib/Utility/ms.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { hasPerms, permResolvableToString } from '../../../lib/Utility/Permissions.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { Message, MessageActionRow, MessageComponentInteraction, Permissions } from 'discord.js';
import { bold, inlineCode } from '@discordjs/builders';

interface GiveawaySettings {
    endDate: Date | null
    prize: string
    winners: number
}

const description = 
    `Welcome to Khafra-Bot's giveaway creator. There are a few settings ` +
    `that you may wish to tweak, so we're going to go through the list. ` +
    `Follow the instructions and it'll be done quickly. :) \n\n`;

const winnersRange = Range(1, 100);
const monthMs = 60 * 1000 * 60 * 24 * 30;
const perms = new Permissions([
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.VIEW_CHANNEL
]);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Giveaway: create a giveaway that ends after a given time!',
                '#general',
                '12345678901234567'
            ],
			{
                name: 'giveaway:create',
                folder: 'Giveaways',
                aliases: ['giveaways:create'],
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message): Promise<unknown> {
        // TODO(@KhafraDev): wtf perms should this be available for?
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        }

        const channel = await getMentions(message, 'channels', { idx: 2 });

        const settings: GiveawaySettings = {
            endDate: null,
            prize: null,
            winners: 1
        };

        if (!isText(channel)) {
            return this.Embed.fail(`${channel ?? 'Unknown channel'} isn't a text channel!`);
        } else if (!hasPerms(channel, message.guild.me, perms)) {
            return this.Embed.fail(`I don't have one or more of these ${permResolvableToString(perms)} permissions in ${channel}.`);
        }

        const m = await message.channel.send({
            embeds: [
                this.Embed.success(`${description}${bold('Do you want more than 1 winner?')}`)
                    .addField(`${bold('Channel:')}`, `${channel}`, true)
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve('Yes', 'winners'),
                    Components.deny('No', 'deny')
                )
            ]
        });

        { // handle # of winners
            let moreWinnersInteraction: MessageComponentInteraction | null = null;
            try {
                moreWinnersInteraction = await m.awaitMessageComponent({
                    time: 20_000,
                    filter: (interaction) =>
                        interaction.user.id === message.author.id &&
                        ['winners', 'deny'].includes(interaction.customId)
                });
            } catch {
                return void m.edit({
                    embeds: [
                        this.Embed.fail('No response within 20 seconds, giveaway canceled.')
                    ],
                    components: disableAll(m)
                });
            }

            // user wants multiple winners
            if (moreWinnersInteraction.customId === 'winners') {
                await m.edit({
                    embeds: [
                        this.Embed.success(`${description}${bold('How many winners should there be?')}`)
                            .addField(`${bold('Channel:')}`, `${channel}`, true)
                    ],
                    components: []
                });

                const w = await message.channel.awaitMessages({
                    max: 1,
                    time: 20_000,
                    filter: (m) => 
                        m.author.id === message.author.id &&
                        validateNumber(Number(m.content)) &&
                        winnersRange.isInRange(Number(m.content))
                });

                if (w.size === 0) {
                    return void m.edit({
                        embeds: [this.Embed.fail(`Didn't respond in time, giveaway canceled.`)]
                    });
                }

                settings.winners = Number(w.first().content);
            }

            const embed = this.Embed.success()
                .setDescription(`${description}${bold('What should the prize be? (5 minutes)')}`)
                .addField(`${bold('Channel:')}`, `${channel}`, true)
                .addField(bold(`Winner${plural(settings.winners)}:`), `${settings.winners} user${plural(settings.winners)}`, true);

            await m.edit({
                embeds: [embed],
                components: []
            });
        }

        { // handle setting the prize
            const prize = await message.channel.awaitMessages({
                max: 1,
                time: 60 * 1000 * 5,
                filter: (m: Message) =>
                    m.author.id === message.author.id &&
                    m.content.length > 0
            });

            if (prize.size === 0) {
                return void m.edit({
                    embeds: [this.Embed.fail(`Didn't respond in time, giveaway canceled.`)]
                });
            }

            settings.prize = prize.first().content;

            const embed = m.embeds[0]
                .setDescription(`
                ${description}
                ${bold('Prize:')}
                ${inlineCode(settings.prize.length > 500 ? `${settings.prize.slice(0, 500)}...` : settings.prize)}
                
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
                filter: (m: Message) =>
                    m.author.id === message.author.id &&
                    (endStr = parseStrToMs(m.content)) !== null &&
                    endStr >= 0 && // not negative
                    endStr >= 1000 * 60 && // longer than 1 minute
                    endStr <= monthMs // less than a month
            });

            if (end.size === 0) {
                return void m.edit({
                    embeds: [this.Embed.fail(`Didn't respond with a valid time, giveaway canceled.`)]
                });
            }

            settings.endDate = new Date(Date.now() + endStr);
        }

        const sent = await channel.send({
            embeds: [
                this.Embed.success()
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

        await pool.query(`
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
            ) ON CONFLICT DO NOTHING;
        `, [
            message.guild.id, 
            sent.id,
            channel.id,
            message.member.id, 
            settings.endDate, 
            settings.prize, 
            settings.winners
        ]);

        await m.edit({
            embeds: [
                this.Embed.success(`Started a giveaway in ${channel}.`)
                    .setFooter('Ends on')
                    .setTimestamp(settings.endDate)
            ]
        });
    }
}