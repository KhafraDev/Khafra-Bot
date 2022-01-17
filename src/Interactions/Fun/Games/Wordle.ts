import { InteractionSubCommand } from '#khaf/Interaction';
import { isTextBased } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ChatInputCommandInteraction, InteractionCollector, Message, MessageActionRow, MessageComponentInteraction } from 'discord.js';
import { inlineCode } from '@khaf/builders';
import { clearInterval, setTimeout } from 'timers';
import { fetch } from 'undici';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { InteractionTypes } from 'discord.js/typings/enums.js';

const games = new Set<string>();
const words: string[] = [];

let interval: NodeJS.Timeout;

class Wordle {
    public guesses: string[] = [];

    constructor (public word: string) {}

    public won () {
        return this.guesses.length <= 6 && this.guesses.includes(this.word);
    }

    public toEmbed () {
        let rows = '';
        const title = ['❔', '❔', '❔', '❔', '❔'];

        for (let i = 0; i < 6; i++) {
            if (this.guesses[i]) {
                let row = '';
                const guess = this.guesses[i];

                for (let j = 0; j < 5; j++) {
                    if (this.word[j] === guess[j]) {
                        row += '🟩 ';
                        title[j] = this.word[j];
                    } else if (this.word.includes(guess[j])) {
                        row += '🟨 ';
                    } else {
                        row += '⬜ ';
                    }
                }

                rows += row + '\n\n';
            } else {
                rows += '⬜ '.repeat(5) + '\n\n';
            }
        }

        return Embed.ok(rows).setTitle(title.join(' '));
    }
}

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'games',
            name: 'wordle'
        });
    }

    async handle (interaction: ChatInputCommandInteraction) {
        if (games.has(interaction.user.id)) {
            return `❌ Finish your other game first!`;
        }

        if (words.length === 0) {
            const r = await fetch('https://raw.githubusercontent.com/madalynrose/Words/71a338251a88e55a1e46622fdcef64f6b17fc321/assets/5-letter.txt');
            const t = await r.text();

            const lines = t
                .split(/\s+/g)
                .filter(word => word.length === 5);

            words.push(...lines);
        }

        let word: string | undefined;
        while (!word) {
            const random = words[Math.floor(Math.random() * words.length)];
            if (!random.endsWith('s')) word = random;
        }

        const game = new Wordle(word);
        games.add(interaction.user.id);

        clearInterval(interval);
        interval = setTimeout(() => {
            words.length = 0;
        }, 60 * 1000 * 60);

        const [err, int] = await dontThrow(interaction.editReply({
            embeds: [game.toEmbed()],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve('Quit', 'quit')
                )
            ]
        }));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        } else if (!(int instanceof Message)) {
            return `❌ Ask an administrator to re-invite the bot with full permissions!`;
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

        const collector = channel.createMessageCollector({
            filter: (m) =>
                interaction.user.id === m.author.id &&
                m.content.length === 5 &&
                words.includes(m.content),
            max: 10,
            idle: 120_000
        });

        const rCollector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionTypes.MESSAGE_COMPONENT,
            message: int,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id
        });

        const checkOver = () => {
            if (game.won()) return collector.stop('winner');
            if (game.guesses.length >= 6) return collector.stop('loser');

            return false;
        }

        collector.on('collect', (m) => {
            game.guesses.push(m.content.toLowerCase());
            const embeds = { embeds: [game.toEmbed().toJSON()] };

            const over = checkOver();
            if (over !== false) return;

            return void dontThrow(int.edit(embeds));
        });

        collector.once('end', (_, reason) => {
            const embed = game.toEmbed();
            embed.setTitle(game.word.split('').join(' '));
            
            games.delete(interaction.user.id);
            if (!rCollector.ended) rCollector.stop(reason);

            switch (reason) {
                case 'winner': {
                    embed.description + `You win!\n\n` + embed.description;
                    break;
                }
                case 'loser': {
                    embed.description = `You lost!\n\n` + embed.description;
                    break;
                }
                default: embed.description = `Game over!\n\n` + embed.description;
            }

            return void dontThrow(int.edit({
                embeds: [embed],
                components: disableAll(int)
            }));
        });

        rCollector.once('collect', (i) => {
            if (!collector.ended) collector.stop();
            rCollector.stop();

            games.delete(interaction.user.id);
            game.guesses.push(word!); // force correct

            return void dontThrow(i.update({
                embeds: [game.toEmbed()],
                components: disableAll(int)
            }));
        })
    }
}