import { Command } from '../../../Structures/Command.js';
import { Message, MessageReaction, Snowflake, User } from 'discord.js';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { plural } from '../../../lib/Utility/String.js';

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
        const m = await message.reply(this.Embed.success()
            .setDescription(word.replace(/[A-z0-9\.]/g, '☐'))
            .setImage(images[wrong])
        );

        const c = message.channel.createMessageCollector(
            (m: Message) =>
                m.author.id === message.author.id &&
                m.content.length > 0 &&
                !guesses.includes(m.content.toLowerCase()),
            { time: 60000, idle: 30000 }
        );

        c.on('collect', (msg: Message) => {
            if (['stop', 'end', 'cancel'].includes(msg.content.toLowerCase()))
                return c.stop('requested');
        
            guesses.push(msg.content);
            const w = word.toLowerCase();
            const t = msg.content.toLowerCase();
            
            if (t === w) { // guessed correct word
                c.stop();
                return m.edit(this.Embed.success()
                    .setTitle('You guessed the word!')
                    .setDescription(`
                    ${word}
                    ${wrong} wrong guess${plural(wrong, 'es')}.
                    Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                    `)
                    .setImage(images[wrong])
                );
            }

            if (
                !w.includes(t) || // letter isn't in the word
                (w.includes(t) && w !== t && t.length > 1) // partially correct
            ) {
                if (++wrong >= 6) { // game lost
                    c.stop();
                    return m.edit(this.Embed.success()
                        .setTitle(`You lost! The word was "${word}"!`)
                        .setDescription(`
                        ${hide(word, guesses)}
                        ${wrong} wrong guess${plural(wrong, 'es')}.
                        Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                        `)
                        .setImage(images[wrong])
                    );
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

                return m.edit(embed);
            }

            return m.edit(this.Embed.success()
                .setTitle(`"${msg.content.slice(0, 10)}" is in the word!`)
                .setDescription(`
                ${hide(word, guesses)}
                ${wrong} wrong guess${plural(wrong, 'es')}.
                Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                `)
                .setImage(images[wrong])
            );
        });

        c.on('end', () => games.delete(message.author.id));

        try { await m.react('❓') } catch {} // ignore error

        const r = m.createReactionCollector(
            (react: MessageReaction, user: User) => 
                user.id === message.author.id &&
                react.emoji.name === '❓',
            { max: 1, time: 60000 }
        );

        r.on('collect', async () => {
            wrong++; // hint = 1 wrong guess added

            // filter out all guessed letters
            const guessesLC = [...guesses, ' ']
                .filter(l => l.length === 1)
                .map(l => l.toLowerCase());
            const letters = [...word.toLowerCase()].filter(letter => !guessesLC.includes(letter));
            const letter = letters[await rand(letters.length)];

            guesses.push(letter);
            return m.edit(this.Embed.success()
                .setTitle(`"${letter}" is the hint!`)
                .setDescription(`
                ${hide(word, guesses)}
                ${wrong} wrong guess${plural(wrong, 'es')}.
                Guessed ${guesses.map(l => `\`\`${l}\`\``).join(', ').slice(0, 250)}
                `)
                .setImage(images[wrong])
            );
        });

        r.on('end', () => {
            if (hasPerms(message.channel, m.guild.me, 'MANAGE_MESSAGES')) 
                return m.reactions.removeAll()
                    .catch(() => {});
        });
    }
}