import { bold, inlineCode } from '@discordjs/builders';
import { Message, MessageActionRow, Snowflake } from 'discord.js';
import { shuffle } from '../../../lib/Utility/Array.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

type Card = [number, typeof suits[number]];

const games = new Set<Snowflake>();
const suits = ['Heart', 'Diamond', 'Clover', 'Spade'] as const;

const makeDeck = () => {
    const cards: Card[] = [];

    for (let i = 1; i <= 13; i++) { // 1-13 (ace to king)
        for (let j = 0; j < 4; j++) { // suits
            cards.push([i, suits[j]]);
        }
    }

    return shuffle(cards);
}

// get total card values
const getTotal = (cards: Card[]) => cards.reduce((a, b) => a + (b[0] > 9 ? 10 : b[0]), 0);
const getName = (v: number) => v > 1 && v <= 10 
    ? `${v}` 
    : { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' }[v];

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game of Blackjack!'
            ],
			{
                name: 'blackjack',
                folder: 'Games',
                args: [0, 0],
                ratelimit: 10, 
                aliases: ['bj']
            }
        );
    }

    async init(message: Message) {
        if (games.has(message.author.id))
            return this.Embed.fail(`Finish your other game before playing another!`);

        const rows = [
            new MessageActionRow()
                .addComponents(
                    Components.approve('Hit', 'hit'),
                    Components.secondary('Stay', 'stay')
                )
        ];

        const deck = makeDeck();
        const score = {
            dealer: deck.splice(0, 2),
            sucker: deck.splice(0, 2)
        };

        const makeEmbed = (desc?: string, hide = true) => {
            const dealerCards = hide ? score.dealer.slice(1) : score.dealer;
            const dealerTotal = hide ? ':' : ` (${getTotal(score.dealer)}):`;
            return this.Embed.success(desc)
                .addField(
                    bold(`Dealer${dealerTotal}`), 
                    dealerCards.map(c => inlineCode(`${getName(c[0])} of ${c[1]}`)).join(', ')
                )
                .addField(
                    bold(`Player (${getTotal(score.sucker)}):`), 
                    score.sucker.map(c => inlineCode(`${getName(c[0])} of ${c[1]}`)).join(', ')
                );
        }

        const m = await message.reply({
            embeds: [makeEmbed()],
            components: rows
        });

        const c = m.createMessageComponentCollector({
            filter: (interaction) => 
                interaction.user.id === message.author.id,
            time: 120_000
        });

        c.on('collect', (i) => {
            if (i.customId === 'hit') {
                const [card, suit] = deck.shift()!;

                score.sucker.push([card, suit]);
                const total = getTotal(score.sucker);

                if (total > 21) { // player lost
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(`You went over 21, you lose!`, false)],
                        components: disableAll(m)
                    }));
                } else { // continue playing
                    return void dontThrow(i.update({ embeds: [makeEmbed()] }));
                }
            } else {
                const totalPlayer = getTotal(score.sucker);

                while (getTotal(score.dealer) < totalPlayer) {
                    score.dealer.push(deck.shift()!);
                }

                const totalDealer = getTotal(score.dealer);

                if (totalDealer > 21) { // dealer goes over 21
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(`You win, I went over 21!`, false)],
                        components: disableAll(m)
                    }));
                } else if (totalDealer >= totalPlayer) { // dealer wins
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(`You lose!`, false)],
                        components: disableAll(m)
                    }));
                }
            }
        });
    }
}