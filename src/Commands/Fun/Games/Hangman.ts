import { Command } from '../../../Structures/Command.js';
import { Message, Snowflake } from 'discord.js';
import { join } from 'path';
import { readFileSync } from 'fs';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const games = new Set<Snowflake>();
const presidents = readFileSync(join(process.cwd(), 'assets/Hangman/presidents.txt'), 'utf-8')
    .split(/\n\r|\n|\r/g)
    .filter(l => !l.startsWith('#') && l.length > 0);

const assets = [
    'https://i.imgur.com/OmbNNhr.png', // nothing 
    'https://i.imgur.com/W9gleFt.png', // head
    'https://i.imgur.com/0MMktbo.png', // body
    'https://i.imgur.com/Y3qL8m3.png', // arm
    'https://i.imgur.com/2VrZF8h.png', // other arm
    'https://i.imgur.com/dOwLtrD.png', // leg
    'https://i.imgur.com/yM0HnGz.png'  // other leg
];

const hide = (word: string, guesses: string[]) =>
    word.replace(new RegExp(`[^${guesses.filter(l => l.length === 1).join('')}]`, 'gi'), '☐');

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
            return this.Embed.fail('You are already in a game!');

        const word = presidents[await rand(presidents.length)];
        const guesses: string[] = [' '];
        let wrong = 0;

        const sent = await message.reply(this.Embed
            .success(hide(word, guesses))
            .setImage(assets[wrong])
        );

        // we add it here in case replying errors out.
        games.add(message.author.id);

        const filter = (m: Message) =>
            m.author.id === message.author.id &&
            /[A-z]/g.test(m.content) &&
            !guesses.includes(m.content.toLowerCase());

        const collector = message.channel.createMessageCollector(filter, {
            time: 120000,
            idle: 60000
        });

        collector.on('collect', async (m: Message) => {
            if (sent.deleted)
                return collector.stop();

            const c = m.content.toLowerCase();
            guesses.push(c);
            if (!word.toLowerCase().includes(c))
                wrong++;
            
            const right = m.content.toLowerCase() === word.toLowerCase();
            const embed = this.Embed.success()
                .setDescription(`
                ${right ? word : hide(word, guesses)}
                ${wrong} wrong guesses.
                Guessed ${guesses.slice(1).map(l => `\`\`${l}\`\``).join(', ').slice(0, 1000)}.
                `)
                .setImage(assets[wrong]);
        
            if (new RegExp(hide(word, guesses), 'i').test(word) || right) {
                embed.setTitle('You guessed the word!');
                collector.stop();
            } else if (wrong >= 6) {
                embed.setTitle(`You lost! The word was "${word}"!`);
                collector.stop();
            }
            
            return sent.edit(embed);
        });

        collector.on('end', () => games.delete(message.author.id));
    }
}