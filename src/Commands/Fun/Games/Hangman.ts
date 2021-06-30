import { Command } from '../../../Structures/Command.js';
import { Message, MessageActionRow, Snowflake } from 'discord.js';
import { join } from 'path';
import { readFileSync } from 'fs';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { plural } from '../../../lib/Utility/String.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { performance } from 'perf_hooks';

const games = new Set<Snowflake>();
const presidents = readFileSync(join(process.cwd(), 'assets/Hangman/presidents.txt'), 'utf-8')
    .split(/\n\r|\n|\r/g)
    .filter(l => !l.startsWith('#') && l.length > 0);

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
    word.replace(new RegExp(`[^${guesses.filter(l => l.length === 1).join('')} ]`, 'gi'), '☐');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game of Hangman!'
            ],
			{
                name: 'hangman',
                folder: 'Games',
                args: [0, 0],
                ratelimit: 30
            }
        );
    }

    async init(message: Message) {
        if (games.has(message.author.id))
            return this.Embed.fail('Finish your current game before starting another!');

        let wrong = 0; // number of wrong guesses
        const guesses: string[] = []; // guesses

        const word = presidents[await rand(presidents.length)];
        const embed = this.Embed.success()
            .setDescription(word.replace(/[A-z0-9\.]/g, '☐'))
            .setImage(images[wrong]);
        const row = new MessageActionRow()
            .addComponents(Components.primary('Hint', 'hint'));
        
        const m = await message.reply({
            embeds: [embed],
            components: [row]
        });

        const start = performance.now();

        const c = message.channel.createMessageCollector({
            filter: m =>
                m.author.id === message.author.id &&
                m.content.length > 0 &&
                !guesses.includes(m.content.toLowerCase()),
            time: 60000, 
            idle: 30000
        });

        c.on('collect', (msg: Message) => {
            if (['stop', 'end', 'cancel'].includes(msg.content.toLowerCase()))
                return c.stop('requested');
        
            guesses.push(msg.content);
            const w = word.toLowerCase();
            const t = msg.content.toLowerCase();
            
            const guessesLC = guesses.map(g => g.toLowerCase());
            if (!guessesLC.includes(' ')) guessesLC.push(' ');

            if (
                t === w ||
                [...w].every(l => guessesLC.includes(l)) // every char in the word has been guessed
            ) { // guessed correct word
                c.stop();
                const embed = this.Embed.success()
                    .setTitle('You guessed the word!')
                    .setImage(images[wrong])
                    .setDescription(`
                    ${word}
                    ${wrong} wrong guess${plural(wrong, 'es')}.
                    Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                    `);
                return void m.edit({
                    content: null,
                    embeds: [embed],
                    components: []
                });
            }
            
            if (
                !w.includes(t) || // letter isn't in the word
                (w.includes(t) && w !== t && t.length > 1) // partially correct
            ) {
                if (++wrong >= 6) { // game lost
                    c.stop();
                    const embed = this.Embed.success()
                        .setTitle(`You lost! The word was "${word}"!`)
                        .setImage(images[wrong])
                        .setDescription(`
                        ${hide(word, guesses)}
                        ${wrong} wrong guess${plural(wrong, 'es')}.
                        Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                        `)
                    return void m.edit({
                        content: null,
                        embeds: [embed],
                        components: []
                    });
                }

                const embed = this.Embed.success()
                    .setDescription(`
                    ${hide(word, guesses)}
                    ${wrong} wrong guess${plural(wrong, 'es')}.
                    Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                    `)
                    .setImage(images[wrong]);

                if (w.includes(t) && w !== t)
                    embed.setTitle('Partial guesses are marked as incorrect!');

                return void m.edit({ embeds: [embed] });
            }

            const now = performance.now();
            const embed = this.Embed.success()
                .setTitle(`"${msg.content.slice(0, 10)}" is in the word!`)
                .setImage(images[wrong])
                .setDescription(`
                ${hide(word, guesses)}
                ${wrong} wrong guess${plural(wrong, 'es')}.
                Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                `);

            return void m.edit({
                content: `⏰ Time remaining: ${(60 - ((now - start) / 1000)).toFixed(2)} seconds!`,
                embeds: [embed]
            });
        });

        c.on('end', () => void games.delete(message.author.id));

        const r = m.createMessageComponentInteractionCollector({
            filter: (interaction) => 
                interaction.message.id === m.id &&
                interaction.user.id === message.author.id &&
                interaction.customID === 'hint',
            max: 1, 
            time: 60000
        });

        r.once('collect', i => {
            wrong++; // hint = 1 wrong guess added

            // filter out all guessed letters
            const guessesLC = [...guesses, ' ']
                .filter(l => l.length === 1)
                .map(l => l.toLowerCase());
            const letters = [...word.toLowerCase()].filter(letter => !guessesLC.includes(letter));
            const letter = letters[Math.floor(Math.random() * letters.length)];
            guesses.push(letter);

            const embed = this.Embed.success()
                .setTitle(`"${letter}" is the hint!`)
                .setImage(images[wrong])
                .setDescription(`
                ${hide(word, guesses)}
                ${wrong} wrong guess${plural(wrong, 'es')}.
                Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                `);
            
            return void i.update({
                embeds: [embed],
                components: disableAll(m)
            });
        });
    }
}