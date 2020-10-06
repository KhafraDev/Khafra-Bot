import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { join } from "path";
import { readdirSync } from "fs";
import { readFile } from "fs/promises";

const base = join(process.cwd(), 'assets/Hangman');
const lists = readdirSync(base).map(f => f.replace('.txt', ''));

const assets = [
    'https://i.imgur.com/OmbNNhr.png', // nothing 
    'https://i.imgur.com/W9gleFt.png', // head
    'https://i.imgur.com/0MMktbo.png', // body
    'https://i.imgur.com/Y3qL8m3.png', // arm
    'https://i.imgur.com/2VrZF8h.png', // other arm
    'https://i.imgur.com/dOwLtrD.png', // leg
    'https://i.imgur.com/yM0HnGz.png'  // other leg
]

const hide = (word: string, guesses: string[]) => {
    const hidden: string[] = [];
    for(let i = 0; i < word.length; i++) {
        const letter = word.charAt(i).toLowerCase();
        hidden.push(guesses.includes(letter) || /\s/.test(letter) ? letter : '☐');
    }
    return hidden.join('');
}

const games: string[] = [];
const removeGame = (id: string) => {
    if(games.includes(id) || games.indexOf(id) !== -1) {
        games.splice(games.indexOf(id), 1);
    }
}

export default class extends Command {
    constructor() {
        super(
            [
                'Play a game of Hangman!',
                'presidents', ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'hangman',
                folder: 'Fun',
                args: [0, 1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(games.includes(message.author.id)) {
            return message.channel.send(this.Embed.fail('You are already in a game!'));
        }

        const guesses: string[] = [];
        games.push(message.author.id);
        let wrong = 0;

        const key = args.length === 0 || !(args[0] in lists) 
            ? lists[Math.floor(Math.random() * lists.length)]
            : args[0].toLowerCase();

        const text = await readFile(join(base, `${key}.txt`), {
            encoding: 'utf-8'
        });
        const split = text.split(/\n\r|\n|\r/g).filter(l => !l.startsWith('#') && l.length > 0);
        const word = split[Math.floor(Math.random() * split.length)];

        const sent = await message.channel.send(
            this.Embed.success(hide(word, guesses)).setImage(assets[wrong])
        );

        if(!sent) {
            removeGame(message.author.id);
            return;
        }
        
        const filter = (m: Message) => m.author.id === message.author.id && 
                                       // m.content.length === 1 && // 'a' but not 'a guess'
                                       isNaN(+m.content) && // might as well
                                       !guesses.includes(m.content); // hasn't been guessed already

        const collector = message.channel.createMessageCollector(filter, { time: 120000, max: 26, idle: 60000   });

        collector.on('collect', async (m: Message) => {
            if(!sent || sent?.deleted) {
                collector.stop();
                removeGame(message.author.id);
                return;
            }

            guesses.push(m.content.toLowerCase());
            if(!word.toLowerCase().includes(m.content.toLowerCase())) {
                wrong++;
            }

            const right = m.content.toLowerCase() === word.toLowerCase();
            const embed = this.Embed.success()
                .setDescription(`
                ${right ? word : hide(word, guesses)}
                ${wrong} wrong guesses.
                Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 1000)}.
                `)
                .setImage(assets[wrong]);
        
            if(new RegExp(hide(word, guesses), 'i').test(word) || right) {
                embed.setTitle('You guessed the word!');
                removeGame(message.author.id);
                collector.stop();
            } else if(wrong >= 6) {
                embed.setTitle(`You lost! The word was "${word}"!`);
                removeGame(message.author.id);
                collector.stop();
            }
            
            try {
                await sent.edit(embed);
            } catch {
                collector.stop();
                removeGame(message.author.id);
                return;
            }
        });
    }
}