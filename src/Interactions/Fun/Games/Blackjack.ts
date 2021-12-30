import { InteractionSubCommand } from '#khaf/Interaction';
import { shuffle } from '#khaf/utility/Array.js';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { CommandInteraction, MessageActionRow, Snowflake } from 'discord.js';
import { bold, inlineCode } from '@khaf/builders';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { isTextBased } from '#khaf/utility/Discord.js';

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

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'games',
            name: 'blackjack'
        });
    }

    async handle (interaction: CommandInteraction) {
        if (games.has(interaction.user.id)) {
            return `❌ Finish your other game before playing another!`;
        }

        const rows = [
            new MessageActionRow().addComponents(
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
            return Embed.ok(desc)
                .addField(
                    bold(`Dealer${dealerTotal}`), 
                    dealerCards.map(c => inlineCode(`${getName(c[0])} of ${c[1]}`)).join(', ')
                )
                .addField(
                    bold(`Player (${getTotal(score.sucker)}):`), 
                    score.sucker.map(c => inlineCode(`${getName(c[0])} of ${c[1]}`)).join(', ')
                );
        }

        const [err, int] = await dontThrow(interaction.editReply({
            embeds: [makeEmbed()],
            components: rows
        }));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        }

        let channel = interaction.channel;

        if (!channel) {
            const [err, c] = await dontThrow(interaction.client.channels.fetch(interaction.channelId));

            if (err !== null || c === null) {
                return `❌ Please invite the bot with the correct permissions to use this command!`;
            } else if (!isTextBased(c)) {
                return `❌ This command cannot be used in this channel!`;
            }

            channel = c;
        }

        const collector = channel.createMessageComponentCollector({
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id,
            idle: 30_000
        });

        collector.on('collect', (i) => {
            if (i.customId === 'hit') {
                const [card, suit] = deck.shift()!;

                score.sucker.push([card, suit]);
                const total = getTotal(score.sucker);

                if (total > 21) { // player lost
                    collector.stop();
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(`You went over 21, you lose!`, false)],
                        components: []
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
                    collector.stop();
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(`You win, I went over 21!`, false)],
                        components: []
                    }));
                } else if (totalDealer >= totalPlayer) { // dealer wins
                    collector.stop();
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(`You lose!`, false)],
                        components: []
                    }));
                }
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'idle') {
                return void dontThrow(interaction.editReply({ components: [] }));
            }
        });
    }
} 