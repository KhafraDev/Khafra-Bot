import { Interactions } from '#khaf/Interaction';
import { inlineCode } from '@khaf/builders';
import { CommandInteraction, Message, MessageActionRow, Snowflake, WebhookEditMessageOptions } from 'discord.js';
import { extname, join } from 'path';
import { readdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { rand } from '#khaf/utility/Constants/OneLiners.js';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { plural } from '#khaf/utility/String.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

const assetsPath = join(assets, 'Hangman');
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

    constructor(
        private word: string
    ) {
        this.word = word;
    }

    /**
     * Guess a given phrase or word
     * @returns {boolean} true if the guess was added, false otherwise
     */
    guess(phraseOrChar: string) {
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
    hide() {
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

    toJSON(title = 'Hangman'): WebhookEditMessageOptions {
        const components = this.winner || this.lost
            ? []
            : [
                new MessageActionRow().addComponents(
                    Components.primary('Hint', 'hint')
                        .setEmoji('❓')
                        .setDisabled(this.usedHint)
                )
            ];

        return {
            embeds: [
                Embed.ok()
                    .setDescription(`
                    ${this.hide()}
                    ${this.wrong} wrong guess${plural(this.wrong, 'es')}.
                    Guessed: ${this.guessed.map(l => inlineCode(l)).join(', ').slice(0, 250)}
                    `)
                    .setImage(images[this.wrong])
                    .setTitle(title)
            ],
            components
        }
    }

    hint() {
        if (this.canUseHint) return null;
        const potential = [...this.word.toLowerCase()].filter(l => !this.guessed.includes(l));

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
        return this.wrong < 6 && (
            // the gusses include the word
            this.guessed.includes(this.word.toLowerCase()) ||
            // every character has been gussed
            [...this.word].every(c => this.guessed.includes(c.toLowerCase()))
        );
    }
}

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'hangman',
            description: `Play a game of hangman!`,
            options: [
                {
                    // see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'list',
                    description: 'list of words that you can use.',
                    required: false
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'play',
                    description: 'choose a list of words to play with.',
                    choices: listsByName.map(word => ({ name: word, value: word })),
                }
            ]
        };
        
        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        if (currentGames.has(interaction.user.id)) {
            return `❌ Finish your current game first!`;
        }

        const shouldList = interaction.options.getBoolean('list') !== null;
        const listName = interaction.options.getString('play', true);

        if (!shouldList && listName === null) {
            return `❌ No options were provided!`;
        }

        if (shouldList) {
            const lists = listsByName
                .map(l => inlineCode(l))
                .join('\n');
                
            return `✅ Here are the word lists that you can play:\n${lists}`;
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
        const word = words[await rand(words.length)]
        const game = new Hangman(word);

        const m = await interaction.editReply(game.toJSON());

        // I assume the bot only has only been invited with slash command perms.
        if (!(m instanceof Message)) {
            return `❌ To play ${inlineCode('hangman')}, please invite the bot to the guild using the ${inlineCode('/invite')} command!`;
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
                c.stop();
            } else if (game.lost) { 
                json = game.toJSON(`You lost! The word was "${word}"!`);
                c.stop();
            } else if (m.content.length === 1) {
                json = game.toJSON(!game.lastGuessWasWrong
                    ? `"${m.content.slice(0, 10)}" is in the word!`
                    : `"${m.content.slice(0, 10)}" is not in the word!`
                );
            } else {
                json = game.toJSON(`Partial guesses are not allowed!`);
            }

            return void dontThrow(interaction.editReply(json));
        });

        c.once('end', () => {
            currentGames.delete(interaction.user.id);
            r.stop();

            return void dontThrow(m.edit({
                content: `Game over!`,
                components: disableAll(m)
            }));
        });

        const r = m.createMessageComponentCollector({
            filter: (interaction) => 
                interaction.message?.id === m.id &&
                interaction.user.id === interaction.user.id &&
                interaction.customId === 'hint',
            max: 1
        });

        r.once('collect', i => {
            if (!game.canUseHint) {
                return void dontThrow(i.update({
                    content: 'You can\'t use a hint now!',
                    components: disableAll(m)
                }));
            }

            
            const hint = game.hint() ?? 'N/A';
            
            return void dontThrow(i.update(game.toJSON(`The hint is: ${hint}`)));
        });
    }
} 