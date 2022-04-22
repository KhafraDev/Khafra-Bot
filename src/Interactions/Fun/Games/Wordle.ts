import { rest } from '#khaf/Bot';
import { InteractionSubCommand } from '#khaf/Interaction';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { Json } from '#khaf/utility/Constants/Path.js';
import { inlineCode } from '@discordjs/builders';
import type { RawFile } from '@discordjs/rest';
import { createCanvas } from '@napi-rs/canvas';
import { Routes, TextInputStyle, type APIActionRowComponent, type APIEmbed, type APIMessageActionRowComponent } from 'discord-api-types/v10';
import {
    InteractionCollector, type ButtonInteraction,
    type ChatInputCommandInteraction,
    type FileOptions, type InteractionReplyOptions,
    type ModalSubmitInteraction,
    type WebhookEditMessageOptions
} from 'discord.js';
import type { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

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

const wordleChoose = (): string => {
    const t = new Date().setHours(0, 0, 0, 0) - WordleEpoch;

    return WordList[Math.round(t / 864e5) % WordList.length];
}

const wordleGetShareComponent = (
    c: APIActionRowComponent<APIMessageActionRowComponent>[],
    { word, guesses }: { word: string, guesses: string[] },
    highContrast: boolean
): APIActionRowComponent<APIMessageActionRowComponent> => {
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

    const link = Buttons.link(
        'Share on Twitter',
        `https://twitter.com/compose/tweet?text=${encodeURIComponent(board)}`
    );

    return Components.actionRow([
        ...c[0].components,
        link
    ]);
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'wordle'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
        if (games.has(interaction.user.id)) {
            return {
                content: '❌ Finish your other game first!',
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

        const attachGame = async (content: string | undefined): Promise<WebhookEditMessageOptions> => {
            const buffer = await this.image(game.interaction, game.guesses, game.word);

            return {
                embeds: [
                    Embed.json({
                        color: colors.ok,
                        image: { url: 'attachment://wordle.png' }
                    })
                ],
                files: [{
                    attachment: buffer,
                    name: 'wordle.png'
                }],
                content
            }
        }

        let endReason: null | string = null;
        const id = randomUUID();
        const game = {
            interaction,
            guesses: [] as string[],
            word: word
        } as const;

        const reply = await interaction.editReply({
            ...await attachGame(undefined),
            components: [
                Components.actionRow([
                    Buttons.approve('Guess', `showModal-${id}`),
                    Buttons.deny('Quit', `quit-${id}`)
                ])
            ]
        });

        const c = new InteractionCollector<ButtonInteraction | ModalSubmitInteraction>(interaction.client, {
            idle: 300_000,
            filter: (i) =>
                i.user.id === interaction.user.id &&
                (i.isButton() || i.isModalSubmit()) &&
                i.customId.endsWith(`-${id}`)
        });

        for await (const [i] of c) {
            // If we receive a button interaction, there can be one of two choices:
            //  - First, the user wants to end the game (quit button)
            //  - Second, the user pressed the button to make a guess.
            // Otherwise, we received a modal submit interaction.
            if (i.isButton()) {
                if (i.customId === `quit-${id}`) {
                    c.stop();
                    endReason = 'user quit';

                    await i.reply({
                        content: 'OK, play again soon! ❤️',
                        ephemeral: true
                    });

                    break;
                }

                await i.showModal({
                    title: 'Wordle',
                    custom_id: `wordleModal-${id}`,
                    components: [
                        Components.actionRow([
                            Components.textInput({
                                custom_id: `textInput-${id}`,
                                label: 'Guess',
                                style: TextInputStyle.Short,
                                max_length: 5,
                                min_length: 5,
                                required: true
                            })
                        ])
                    ]
                });
            } else {
                const answer = i.fields.getField(`textInput-${id}`).value.toLowerCase();
                let content = '';

                // force the idle time to refresh
                if (guessWords.includes(answer) || WordList.includes(answer)) {
                    game.guesses.push(answer.toLowerCase());
                } else {
                    content = 'That word isn\'t in my list, try another word!';
                }

                // This makes a new message, so we need to manually edit the game's message.
                // We need to make this message or else the user will get "interaction failed".
                await i.reply({
                    content: `Checking your answer ${inlineCode(answer)}`,
                    ephemeral: true
                });

                const editOptions = await attachGame(content);
                await rest.patch(
                    Routes.channelMessage('channel_id' in reply ? reply.channel_id : reply.channelId, reply.id),
                    {
                        body: {
                            embeds: editOptions.embeds,
                            content: editOptions.content
                        },
                        files: (editOptions.files as FileOptions[]).map((c): RawFile => ({
                            data: c.attachment as Buffer,
                            name: c.name!
                        }))
                    }
                );

                if (game.guesses.includes(game.word) || game.guesses.length === 6) {
                    c.stop();
                    break;
                }
            }
        }

        // The game ended
        if (endReason !== 'user quit') {
            const options = await attachGame('');
            const embed = (options.embeds as APIEmbed[])[0];

            embed.title = game.word.split('').join(' ');
            games.delete(interaction.user.id);

            if (game.guesses.includes(game.word)) {
                embed.description = 'You win!';
            } else if (game.guesses.length === 6) {
                embed.description = `You lost!\n\nThe word was ${inlineCode(game.word)}!`;
            } else {
                embed.description = `Game over (reason = ${inlineCode(c.endReason ?? 'unknown')})!`;
            }

            await rest.patch(
                Routes.channelMessage('channel_id' in reply ? reply.channel_id : reply.channelId, reply.id),
                {
                    body: {
                        embeds: options.embeds,
                        content: options.content,
                        components: [wordleGetShareComponent(disableAll(reply), game, highContrast)]
                    },
                    files: (options.files as FileOptions[]).map((c): RawFile => ({
                        data: c.attachment as Buffer,
                        name: c.name!
                    }))
                }
            );
        } else {
            await rest.patch(
                Routes.channelMessage('channel_id' in reply ? reply.channel_id : reply.channelId, reply.id),
                {
                    body: {
                        components: [wordleGetShareComponent(disableAll(reply), game, highContrast)]
                    }
                }
            );
        }
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