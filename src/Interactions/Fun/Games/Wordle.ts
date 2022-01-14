import { InteractionSubCommand } from '#khaf/Interaction';
import { isTextBased } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ChatInputCommandInteraction, Message } from 'discord.js';
import { inlineCode } from '@khaf/builders';
import { clearInterval, setTimeout } from 'timers';
import { fetch } from 'undici';
import { rest } from '#khaf/Bot';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Routes } from 'discord-api-types/v9';

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
            const r = await fetch('https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt');
            const t = await r.text();

            const lines = t
                .split(/\r?\n/g)
                .filter(word => word.length === 5);

            words.push(...lines);
        }

        const word = words[Math.floor(Math.random() * words.length)];
        const game = new Wordle(word);
        games.add(interaction.user.id);

        clearInterval(interval);
        interval = setTimeout(() => {
            words.length = 0;
        }, 60 * 1000 * 60);

        const [err, int] = await dontThrow(interaction.editReply({
            embeds: [game.toEmbed()]
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

        const collector = channel.createMessageCollector({
            filter: (m) =>
                interaction.user.id === m.author.id &&
                m.content.length === 5 &&
                words.includes(m.content),
            max: 10,
            idle: 120_000
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

            if (int instanceof Message) {
                return void dontThrow(int.edit(embeds));
            } else {
                return void dontThrow(rest.patch(
                    Routes.channelMessage(int.channel_id, int.id),
                    { body: embeds }
                ));
            }
        });

        collector.once('end', (_, reason) => {
            const embed = game.toEmbed();
            embed.setTitle(game.word.split('').join(' '));

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

            if (int instanceof Message) {
                return void dontThrow(int.edit({ embeds: [embed] }));
            } else {
                return void dontThrow(rest.patch(
                    Routes.channelMessage(int.channel_id, int.id),
                    { body: { embeds: [embed] } }
                ));
            }
        });
    }
}