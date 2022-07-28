import { InteractionSubCommand } from '#khaf/Interaction';
import { shuffle } from '#khaf/utility/Array.js';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, inlineCode } from '@discordjs/builders';
import type { APIEmbed} from 'discord-api-types/v10';
import { InteractionType } from 'discord-api-types/v10';
import type { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions, Snowflake } from 'discord.js';
import { InteractionCollector } from 'discord.js';
import { randomUUID } from 'node:crypto';

type Card = [number, typeof suits[number]];

const games = new Set<Snowflake>();
const suits = ['Heart', 'Diamond', 'Clover', 'Spade'] as const;

const makeDeck = (): Card[] => {
    const cards: Card[] = [];

    for (let i = 1; i <= 13; i++) { // 1-13 (ace to king)
        for (let j = 0; j < 4; j++) { // suits
            cards.push([i, suits[j]]);
        }
    }

    return shuffle(cards);
}

// get total card values
const getTotal = (cards: Card[]): number => cards.reduce((a, b) => a + (b[0] > 9 ? 10 : b[0]), 0);
const getName = (v: number): string => v > 1 && v <= 10
    ? `${v}`
    : { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' }[v]!;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'blackjack'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        if (games.has(interaction.user.id)) {
            return {
                content: '❌ Finish your other game before playing another!',
                ephemeral: true
            }
        }

        const id = randomUUID();
        const rows = [
            Components.actionRow([
                Buttons.approve('Hit', `hit-${id}`),
                Buttons.secondary('Stay', `stay-${id}`)
            ])
        ];

        const deck = makeDeck();
        const score = {
            dealer: deck.splice(0, 2),
            sucker: deck.splice(0, 2)
        };

        const makeEmbed = (desc?: string, hide = true): APIEmbed => {
            const dealerCards = hide ? score.dealer.slice(1) : score.dealer;
            const dealerTotal = hide ? ':' : ` (${getTotal(score.dealer)}):`;

            return Embed.json({
                color: colors.ok,
                description: desc,
                fields: [
                    {
                        name: bold(`Dealer${dealerTotal}`),
                        value: dealerCards.map(c => inlineCode(`${getName(c[0])} of ${c[1]}`)).join(', ')
                    },
                    {
                        name: bold(`Player (${getTotal(score.sucker)}):`),
                        value: score.sucker.map(c => inlineCode(`${getName(c[0])} of ${c[1]}`)).join(', ')
                    }
                ]
            });
        }

        const int = await interaction.editReply({
            embeds: [makeEmbed()],
            components: rows
        });

        const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            idle: 30_000,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id &&
                i.customId.endsWith(id)
        });

        for await (const [i] of collector) {
            if (i.customId.startsWith('hit')) {
                const [card, suit] = deck.shift()!;

                score.sucker.push([card, suit]);
                const total = getTotal(score.sucker);

                if (total > 21) { // player lost
                    collector.stop();
                    await i.update({
                        embeds: [makeEmbed('You went over 21, you lose!', false)],
                        components: disableAll(int)
                    });
                } else { // continue playing
                    await i.update({ embeds: [makeEmbed()] });
                }
            } else {
                const totalPlayer = getTotal(score.sucker);

                while (getTotal(score.dealer) < totalPlayer) {
                    score.dealer.push(deck.shift()!);
                }

                const totalDealer = getTotal(score.dealer);

                if (totalDealer > 21) { // dealer goes over 21
                    collector.stop();
                    await i.update({
                        embeds: [makeEmbed('You win, I went over 21!', false)],
                        components: disableAll(int)
                    });
                } else if (totalDealer >= totalPlayer) { // dealer wins
                    collector.stop();
                    await i.update({
                        embeds: [makeEmbed('You lose!', false)],
                        components: disableAll(int)
                    });
                }
            }
        }

        if (collector.endReason === 'idle') {
            await interaction.editReply({
                components: disableAll(int)
            });
        }
    }
}