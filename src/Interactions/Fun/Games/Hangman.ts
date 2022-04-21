import { InteractionSubCommand } from '#khaf/Interaction';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { plural } from '#khaf/utility/String.js';
import { inlineCode } from '@discordjs/builders';
import { type APIActionRowComponent, type APIMessageActionRowComponent, InteractionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, MessageComponentInteraction, Snowflake, WebhookEditMessageOptions } from 'discord.js';
import { InteractionCollector, Message } from 'discord.js';
import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const assetsPath = assets('Hangman');
const listsByName = readdirSync(assetsPath).map(f => f.replace(extname(f), ''));
const cachedLists = new Map<string, string[]>();
const currentGames = new Set<Snowflake>();
const images = [
    'https://i.imgur.com/OmbNNhr.png', // nothing
    'https://i.imgur.com/W9gleFt.png', // head
    'https://i.imgur.com/0MMktbo.png', // body
    'https://i.imgur.com/Y3qL8m3.png', // left arm
    'https://i.imgur.com/2VrZF8h.png', // right arm
    'https://i.imgur.com/dOwLtrD.png', // left leg
    'https://i.imgur.com/yM0HnGz.png'  // right leg
];

class Hangman {
    private guessed: string[] = [];
    private wrong = 0;

    private usedHint = false;
    public lastGuessWasWrong = false;

    constructor (
        private word: string
    ) {}

    /**
     * Guess a given phrase or word
     * @returns true if the guess was added, false otherwise
     */
    guess (phraseOrChar: string): boolean {
        const guess = phraseOrChar.toLowerCase();

        if (this.guessed.includes(guess)) {
            return false;
        } else {
            if (
                (guess.length === 1 && !this.word.toLowerCase().includes(guess)) ||
                (guess.length > 1 && guess !== this.word.toLowerCase())
            ) {
                this.lastGuessWasWrong = true;
                ++this.wrong;
            } else {
                this.lastGuessWasWrong = false;
            }

            this.guessed.push(guess);
            return true;
        }
    }

    /**
     * Replaces characters not guessed with a box.
     */
    hide (): string {
        let str = '';

        if (this.guessed.includes(this.word.toLowerCase())) {
            return this.word;
        }

        for (const char of this.word.toLowerCase()) {
            if (char === ' ') {
                str += ' ';
            } else if (this.guessed.includes(char)) {
                str += char;
            } else {
                str += '☐';
            }
        }

        return str;
    }

    toJSON (title = 'Hangman'): WebhookEditMessageOptions {
        const components = this.winner || this.lost
            ? undefined :
            [] as APIActionRowComponent<APIMessageActionRowComponent>[];

        if (components !== undefined) {
            const row = Components.actionRow();
            const button = Buttons.primary('Hint', 'hint');
            button.emoji = { name: '❓' };
            button.disabled = this.usedHint;
            row.components.push(button);

            components.push(row);
        }

        const embed = Embed.json({
            color: colors.ok,
            description: `
            ${this.hide()}
            ${this.wrong} wrong guess${plural(this.wrong, 'es')}.
            Guessed: ${this.guessed.map(l => inlineCode(l)).join(', ').slice(0, 250)}`,
            image: { url: images[this.wrong] },
            title
        });

        return {
            embeds: [embed],
            components
        }
    }

    hint (): string | null {
        if (!this.canUseHint) return null;
        const potential = [...this.word.toLowerCase()]
            .filter(l => !this.guessed.includes(l) && l !== ' ');

        this.usedHint = true;

        const char = potential[Math.floor(Math.random() * potential.length)];
        this.guess(char);
        this.wrong++;

        return char;
    }

    get canUseHint(): boolean {
        return this.wrong + 1 < 6 && !this.usedHint;
    }

    get lost(): boolean {
        return this.wrong >= 6;
    }

    get winner(): boolean {
        const lessThan6Wrong = this.wrong < 6;
        const guessedEntireWord = this.guessed.includes(this.word.toLowerCase());
        const gussedEveryChar = [...this.word.toLowerCase()].every(
            c => c === ' ' || this.guessed.includes(c.toLowerCase())
        );

        return lessThan6Wrong && (guessedEntireWord || gussedEveryChar);
    }
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'hangman'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        if (currentGames.has(interaction.user.id)) {
            return {
                content: '❌ Finish your current game first!',
                ephemeral: true
            }
        } else if (!interaction.inGuild()) {
            return {
                content: '❌ I can\'t read your messages! Re-invite the bot with all permissions to use this command!',
                ephemeral: true
            }
        }

        const shouldList = interaction.options.getSubcommand() === 'list';
        const listName = interaction.options.getString('lists') ?? 'presidents';

        if (shouldList) {
            const lists = listsByName
                .map(l => `• ${inlineCode(l)}`)
                .join('\n');

            return {
                content: `✅ Here are the word lists that you can play:\n${lists}`
            }
        }

        let words!: string[];
        if (cachedLists.has(listName)) {
            words = cachedLists.get(listName)!;
        } else {
            const path = join(assetsPath, `${listName}.txt`);
            const text = await readFile(path, 'utf-8');

            words = text
                .split(/\n\r|\n|\r/g)
                .filter(l => !l.startsWith('#') && l.length > 0);

            cachedLists.set(listName, words);
        }

        currentGames.add(interaction.user.id);
        const word = words[Math.floor(Math.random() * words.length)];
        const game = new Hangman(word);

        const m = await interaction.editReply(game.toJSON());

        // I assume the bot only has only been invited with slash command perms.
        if (!(m instanceof Message)) {
            return {
                content:
                    `❌ To play ${inlineCode('hangman')}, please invite the bot` +
                    ` to the guild using the ${inlineCode('/invite')} command!`,
                ephemeral: true
            }
        }

        const c = m.channel.createMessageCollector({
            filter: m =>
                m.author.id === interaction.user.id &&
                m.content.length > 0,
            idle: 30_000
        });

        c.on('collect', (m) => {
            const guessed = game.guess(m.content);

            if (guessed === false) return;

            let json!: WebhookEditMessageOptions;
            if (game.winner) {
                json = game.toJSON('You guessed the word!');
                c.stop('do_not_edit');
            } else if (game.lost) {
                json = game.toJSON(`You lost! The word was "${word}"!`);
                c.stop('do_not_edit');
            } else if (m.content.length === 1) {
                json = game.toJSON(!game.lastGuessWasWrong
                    ? `"${m.content.slice(0, 10)}" is in the word!`
                    : `"${m.content.slice(0, 10)}" is not in the word!`
                );
            } else {
                json = game.toJSON('Partial guesses are not allowed!');
            }

            return void dontThrow(interaction.editReply(json));
        });

        c.once('end', (_, reason) => {
            currentGames.delete(interaction.user.id);
            r.stop();

            if (reason === 'do_not_edit') {
                return;
            }

            const g = reason === 'idle'
                ? 'Game over! You took too long to guess!'
                : 'Game over! You guessed the word!';

            return void dontThrow(m.edit({
                ...game.toJSON(g),
                components: disableAll(m)
            }));
        });

        const r = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: m,
            max: 1,
            filter: (i) =>
                i.message.id === m.id &&
                i.user.id === interaction.user.id &&
                i.customId === 'hint'
        });

        r.once('collect', i => {
            if (!game.canUseHint) {
                return void dontThrow(i.update({
                    content: 'You can\'t use a hint now!',
                    components: disableAll(m)
                }));
            }

            const hint = game.hint() ?? 'N/A';

            return void dontThrow(i.update({
                ...game.toJSON(`The hint is: ${hint}`),
                components: disableAll(m)
            }));
        });
    }
}