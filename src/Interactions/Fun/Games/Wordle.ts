import { InteractionSubCommand } from '#khaf/Interaction';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { Json } from '#khaf/utility/Constants/Path.js';
import { isDM, isTextBased } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import type { MessageActionRowComponentBuilder } from '@discordjs/builders';
import { ActionRowBuilder, inlineCode } from '@discordjs/builders';
import { createCanvas } from '@napi-rs/canvas';
import { InteractionType } from 'discord-api-types/v10';
import type {
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    MessageComponentInteraction,
    WebhookEditMessageOptions
} from 'discord.js';
import {
    InteractionCollector,
    Message,
    Attachment
} from 'discord.js';
import type { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { clearInterval, setTimeout } from 'node:timers';

const Dims = {
    Width: 330,
    Box: 62,
    GuessWidth: 29
} as const;

// https://reichel.dev/blog/reverse-engineering-wordle.html#looking-at-the-source
// This article did help, however none of the code
// provided in the article was used (nor did it work).

const games = new Set<string>();
/* Words that cannot be chosen, but are valid guesses */
const guessWords: string[] = [];
/* Words that can be chosen */
const WordList: string[] = [];
const WordleEpoch = new Date(2021, 5, 19, 0, 0, 0, 0).getTime();

let interval: NodeJS.Timeout;

const wordleChoose = (): string => {
    const t = new Date().setHours(0, 0, 0, 0) - WordleEpoch;

    return WordList[Math.round(t / 864e5) % WordList.length];
}

const wordleGetShareComponent = (
    c: ActionRowBuilder<MessageActionRowComponentBuilder>[],
    { word, guesses }: { word: string, guesses: string[] },
    highContrast: boolean
): ActionRowBuilder<MessageActionRowComponentBuilder> => {
    // const dayOffset = Math.floor((Date.now() - WordleEpoch) / 86_400_000);
    let board = `Wordle ${guesses.length}/6\n\n`;

    for (let guessIdx = 0; guessIdx < guesses.length; guessIdx++) {
        const guess = guesses[guessIdx];
        let line = '';

        for (let letters = 0; letters < 5; letters++) {
            if (word[letters] === guess[letters]) {
                line += highContrast ? '🟧 ' : '🟩 ';
            } else if (word.includes(guess[letters])) {
                line += highContrast ? '🟦 ' : '🟨 ';
            } else {
                line += '⬛ ';
            }
        }

        board += `${line.trimEnd()}\n`;
    }

    board += '\nBy @KhafraDev!';

    const link = Components.link(
        'Share on Twitter',
        `https://twitter.com/compose/tweet?text=${encodeURIComponent(board)}`
    );

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        ...c[0].components,
        link
    );
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'wordle'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        if (games.has(interaction.user.id)) {
            return {
                content: '❌ Finish your other game first!',
                ephemeral: true
            }
        } else if (!interaction.inGuild()) {
            return {
                content: '❌ I can\'t read your messages! Re-invite the bot with all permissions to use this command!',
                ephemeral: true
            }
        }

        const highContrast = interaction.options.getBoolean('official-word') ?? false;
        const useOfficialWord = interaction.options.getBoolean('official-word') ?? false;

        if (guessWords.length === 0) {
            const wordleGuesses = readFileSync(Json('Wordle-Guesses.json'), 'utf-8');
            guessWords.push(...JSON.parse(wordleGuesses) as string[]);
        }

        if (WordList.length === 0) {
            const wordleWords = readFileSync(Json('Wordle-Answers.json'), 'utf-8');
            WordList.push(...JSON.parse(wordleWords) as string[]);
        }

        const word = useOfficialWord
            ? wordleChoose()
            : WordList[Math.floor(Math.random() * WordList.length)];

        const game = {
            interaction,
            guesses: [] as string[],
            word: word
        } as const;

        games.add(interaction.user.id);
        clearInterval(interval);
        interval = setTimeout(() => {
            guessWords.length = 0;
            WordList.length = 0;
        }, 60 * 1000 * 60);

        const attachGame = async (): Promise<WebhookEditMessageOptions> => {
            const buffer = await this.image(game.interaction, game.guesses, game.word);
            const attachment = new Attachment(buffer, 'wordle.png');

            return {
                embeds: [
                    EmbedUtil.setImage(
                        Embed.ok(),
                        { url: 'attachment://wordle.png' }
                    )
                ],
                files: [attachment]
            }
        }

        const [err, int] = await dontThrow(interaction.editReply({
            ...await attachGame(),
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    Components.approve('Quit', 'quit')
                )
            ]
        }));

        if (err !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        } else if (!(int instanceof Message)) {
            return {
                content: '❌ Ask an administrator to re-invite the bot with full permissions!',
                ephemeral: true
            }
        }

        let channel = interaction.channel;

        if (!channel) {
            const [err, c] = await dontThrow(interaction.client.channels.fetch(interaction.channelId));

            if (err !== null || c === null) {
                return {
                    content: '❌ Please invite the bot with the correct permissions to use this command!',
                    ephemeral: true
                }
            } else if (!isTextBased(c) || isDM(c)) {
                return {
                    content: '❌ This command cannot be used in this channel!',
                    ephemeral: true
                }
            }

            channel = c;
        }

        const collector = channel.createMessageCollector({
            filter: (m): boolean =>
                interaction.user.id === m.author.id &&
                m.content.length === 5 &&
                m.channel.id === channel!.id,
            idle: 300_000
        });

        const rCollector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id
        });

        const checkOver = (): false | void => {
            if (game.guesses.includes(game.word)) return collector.stop('winner');
            if (game.guesses.length >= 6) return collector.stop('loser');

            return false;
        }

        collector.on('collect', async (m) => {
            // force the idle time to refresh
            if (
                !guessWords.includes(m.content.toLowerCase()) &&
                !WordList.includes(m.content.toLowerCase())
            ) {
                return;
            }

            game.guesses.push(m.content.toLowerCase());

            const over = checkOver();
            if (over !== false) return;

            return void dontThrow(int.edit(await attachGame()));
        });

        collector.once('end', async (_, reason) => {
            const options = await attachGame();
            const embed = 'toJSON' in options.embeds![0]
                ? options.embeds![0].toJSON()
                : options.embeds![0];

            EmbedUtil.setTitle(embed, game.word.split('').join(' '));
            games.delete(interaction.user.id);

            if (!rCollector.ended) rCollector.stop(reason);

            if (reason === 'winner') {
                EmbedUtil.setDescription(embed, 'You win!');
            } else if (reason === 'loser') {
                EmbedUtil.setDescription(embed, `You lost!\n\nThe word was ${inlineCode(game.word)}!`);
            } else {
                EmbedUtil.setDescription(embed, `Game over (reason = ${inlineCode(reason)})!`);
            }

            return void dontThrow(int.edit({
                ...options,
                components: [wordleGetShareComponent(disableAll(int), game, highContrast)]
            }));
        });

        rCollector.once('collect', async (i) => {
            if (!collector.ended) collector.stop();
            rCollector.stop();

            const options = await attachGame();

            games.delete(interaction.user.id);
            game.guesses.push(word); // force correct

            return void dontThrow(i.update({
                ...options,
                components: disableAll(int)
            }));
        });
    }

    async image (
        interaction: ChatInputCommandInteraction,
        guesses: string[],
        word: string
    ): Promise<Buffer> {
        const highContrast = interaction.options.getBoolean('highcontrast') ?? false;

        const canvas = createCanvas(Dims.Width + 60 + 5, Dims.Box * 6 + 6 * 4);
        const ctx = canvas.getContext('2d');

        const lettersCorrect = new Set<Uppercase<string>>();
        const lettersGuessed = new Set<Uppercase<string>>();

        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let guessIdx = 0; guessIdx < 6; guessIdx++) {
            const guess = guesses[guessIdx];
            for (let letters = 0; letters < 5; letters++) {
                const letter = guess ? guess[letters] : ' ';

                if (word[letters] === letter) { // correct guess
                    ctx.fillStyle = highContrast
                        ? '#f5793a'
                        : '#538d4e';
                    lettersCorrect.add(letter.toUpperCase());
                } else if (word.includes(letter)) { // incorrect spot but in word
                    ctx.fillStyle = highContrast
                        ? '#85c0f9'
                        : '#b59f3b';
                    lettersCorrect.add(letter.toUpperCase());
                } else {
                    ctx.fillStyle = '#3a3a3c';
                    lettersGuessed.add(letter.toUpperCase());
                }

                ctx.fillRect(
                    letters * Dims.Box + letters * 5,
                    guessIdx * Dims.Box + guessIdx * 5,
                    Dims.Box,
                    Dims.Box
                );

                ctx.fillStyle = '#ffffff';
                ctx.fillText(
                    letter.toUpperCase(),
                    letters * Dims.Box + letters * 5 + (Dims.Box / 2),
                    guessIdx * Dims.Box + guessIdx * 5 + (Dims.Box / 2)
                );
            }
        }

        ctx.font = '16px Arial';

        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(65 + i); // 65 = A
            const xOffset = i >= 13 ? Dims.GuessWidth + 1 : 0;
            const yOffset = i >= 13 ? i - 13 : i;

            if (lettersCorrect.has(char)) {
                ctx.fillStyle = '#538d4e';
            } else if (lettersGuessed.has(char)) {
                ctx.fillStyle = '#3a3a3c';
            } else {
                ctx.fillStyle = '#818384';
            }

            ctx.fillRect(
                Dims.Width + xOffset + 5,
                30 * yOffset + 4,
                Dims.GuessWidth,
                Dims.GuessWidth
            );

            ctx.fillStyle = '#ffffff';
            ctx.fillText(
                char,
                Dims.Width + xOffset + 5 + (Dims.GuessWidth / 2),
                30 * yOffset + 4 + (Dims.GuessWidth / 2)
            );
        }

        return canvas.toBuffer('image/png');
    }
}