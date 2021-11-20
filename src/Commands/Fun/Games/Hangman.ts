import { Arguments, Command } from '../../../Structures/Command.js';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { plural } from '../../../lib/Utility/String.js';
import { Message, MessageActionRow, MessageEditOptions, Snowflake } from 'discord.js';
import { inlineCode } from '@khaf/builders';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { readdirSync } from 'fs';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { assets } from '../../../lib/Utility/Constants/Path.js';

const assetsPath = join(assets, 'Hangman');

const games = new Set<Snowflake>();
const listsByName = readdirSync(assetsPath).map(f => f.replace(extname(f), ''));
const lists = new Map<string, string[]>();

const images = [
    'https://i.imgur.com/OmbNNhr.png', // nothing 
    'https://i.imgur.com/W9gleFt.png', // head
    'https://i.imgur.com/0MMktbo.png', // body
    'https://i.imgur.com/Y3qL8m3.png', // left arm
    'https://i.imgur.com/2VrZF8h.png', // right arm
    'https://i.imgur.com/dOwLtrD.png', // left leg
    'https://i.imgur.com/yM0HnGz.png'  // right leg
];

const hide = (word: string, guesses: string[]) =>
    word.replace(new RegExp(`[^${guesses.filter(l => l.length === 1).join('')}]`, 'gi'), '☐');

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game of Hangman!'
            ],
			{
                name: 'hangman',
                folder: 'Games',
                args: [0, 1],
                ratelimit: 30
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        if (games.has(message.author.id))
            return this.Embed.fail('Finish your current game before starting another!');

        const listName = args.length === 0 ? 'presidents' : args[0].toLowerCase();
        let words: string[] | null = null;
        if (lists.has(listName)) {
            words = lists.get(listName)!;
        } else {
            if (listsByName.includes(listName)) {
                const path = join(assetsPath, `${listName}.txt`);
                const text = await readFile(path, 'utf-8');

                words = text
                    .split(/\n\r|\n|\r/g)
                    .filter(l => !l.startsWith('#') && l.length > 0);
                lists.set(listName, words);
            } else {
                return this.Embed.fail('That list of words doesn\'t exist!');
            }
        }

        let wrong = 0; // number of wrong guesses
        const guesses = [' ']; // guesses
        const word = words[await rand(words.length)];

        const m = await message.reply({
            embeds: [
                this.Embed.success()
                    .setDescription(hide(word, guesses))
                    .setImage(images[wrong])
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.primary('Hint', 'hint').setEmoji('❓')
                )
            ]
        });

        const c = message.channel.createMessageCollector({
            filter: m =>
                m.author.id === message.author.id &&
                m.content.length > 0 &&
                !guesses.includes(m.content.toLowerCase()) &&
                wrong < 6,
            idle: 30_000
        });

        c.on('collect', (msg) => {
            if (wrong > 6 || m.deleted || !m.editable) return c.stop();

            const guess = msg.content.toLowerCase();
            const wordLc = word.toLowerCase();
            guesses.push(guess);

            const opts = {
                content: null,
                embeds: []
            } as MessageEditOptions;

            if ( // win case
                [...wordLc].every(char => guesses.includes(char.toLowerCase())) || // every char guessed
                guess === wordLc // guess is the word
            ) {
                c.stop();
                opts.content = null;
                opts.components = disableAll(m);
                opts.embeds!.push(this.Embed.success()
                    .setTitle('You guessed the word!')
                    .setImage(images[wrong])
                    .setDescription(`
                    ${word}\n${wrong} wrong guess${plural(wrong, 'es')}.
                    Guessed ${guesses.slice(1).map(l => inlineCode(l)).join(', ').slice(0, 250)}
                    `)
                );
            } else if ( // wrong guess
                (guess.length === 1 && !wordLc.includes(guess)) || // word doesn't include character
                guess.length > 1 // guess isn't a single character
            ) {
                if (++wrong >= 6) {
                    opts.content = null;
                    opts.components = disableAll(m);
                    opts.embeds = [
                        this.Embed.success()
                            .setTitle(`You lost! The word was "${word}"!`)
                            .setImage(images[wrong])
                            .setDescription(`
                            ${hide(word, guesses)}
                            ${wrong} wrong guess${plural(wrong, 'es')}.
                            Guessed ${guesses.slice(1).map(l => inlineCode(l)).join(', ').slice(0, 250)}
                            `)
                    ];
                } else {
                    opts.content = guess.length > 1 ? '❗ Partial guesses do not count.' : null;
                    opts.embeds!.push(this.Embed.success()
                        .setTitle(`That guess is incorrect!`)
                        .setImage(images[wrong])
                        .setDescription(`
                        ${hide(word, guesses)}
                        ${wrong} wrong guess${plural(wrong, 'es')}.
                        Guessed ${guesses.slice(1).map(l => inlineCode(l)).join(', ').slice(0, 250)}
                        `)
                    );
                }
            } else { // guess is correct, didn't win or lose
                opts.content = null;
                opts.embeds!.push(this.Embed.success()
                    .setTitle(`"${msg.content.slice(0, 10)}" is in the word!`)
                    .setImage(images[wrong])
                    .setDescription(`
                    ${hide(word, guesses)}
                    ${wrong} wrong guess${plural(wrong, 'es')}.
                    Guessed ${guesses.slice(1).map(l => inlineCode(l)).join(', ').slice(0, 250)}
                    `)
                );
            }

            return void dontThrow(m.edit(opts));
        });

        c.once('end', () => {
            games.delete(message.author.id);
            r.stop();

            return void dontThrow(m.edit({
                content: `Game over!`,
                components: disableAll(m)
            }));
        });

        const r = m.createMessageComponentCollector({
            filter: (interaction) => 
                interaction.message?.id === m.id &&
                interaction.user.id === message.author.id &&
                interaction.customId === 'hint',
            max: 1, 
            time: 60000
        });

        r.once('collect', i => {
            if (wrong + 1 >= 6) {
                return void dontThrow(i.update({
                    content: 'Guessing right now would cause you to lose the game!',
                    components: disableAll(m)
                }));
            }

            // filter out all guessed letters
            const guessesLC = [...guesses, ' ']
                .filter(l => l.length === 1)
                .map(l => l.toLowerCase());
            const letters = [...word.toLowerCase()].filter(letter => !guessesLC.includes(letter));
            const letter = letters[Math.floor(Math.random() * letters.length)];
            guesses.push(letter);

            const embed = this.Embed.success()
                .setTitle(`"${letter}" is the hint!`)
                .setImage(images[++wrong])
                .setDescription(`
                ${hide(word, guesses)}
                ${wrong} wrong guess${plural(wrong, 'es')}.
                Guessed ${guesses.slice(1).map(l => inlineCode(l)).join(', ').slice(0, 250)}
                `);
            
            return void dontThrow(i.update({
                content: null,
                embeds: [embed],
                components: disableAll(m)
            }));
        });
    }
}