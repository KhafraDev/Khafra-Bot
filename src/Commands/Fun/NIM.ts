/*
Nim is one of the most strategic pen and paper games with a surprising level of strategy. 
For Nim, all you need is one piece of paper, a pen and a friend to play with. 
To set Nim up, you must draw three stacks of lines on the paper. 
Each stack of lines must be separate from one another. 
It could look something like this: III IIIII IIII

The number of lines you have in each stack can be different every time, but there must be three stacks. 
Once the lines have been put down, the game can begin. 
In Nim, players take it in turns to remove lines from a single stack. 
If a player is left with the last line to remove, then that player loses. 
Nim is a very strategic game to play on paper because of these two fundamental game rules: 
1. You can remove as many lines as you like each turn, 
2. but the lines you remove each turn must be from the same stack. 
*/

import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import { getMentions } from '../../lib/Utility/Mentions.js';

const gen = () => {
    const game = [
        Array<string>(Math.floor(Math.random() * (9 - 1 + 1) + 1)).fill('I'),
        Array<string>(Math.floor(Math.random() * (9 - 1 + 1) + 1)).fill('I'),
        Array<string>(Math.floor(Math.random() * (9 - 1 + 1) + 1)).fill('I')
    ];

    return game;
}

const games: string[] = [];

export default class extends Command {
    constructor() {
        super(
            [
                'The ancient game of Nim!',
                '@Khafra#0001'
            ],
			{
                name: 'nim',
                folder: 'Fun',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if(games.includes(message.guild.id)) {
            return message.reply(this.Embed.fail('Game already happening in this guild!'));
        }

        const opponent = await getMentions(message, 'members');
        if(!opponent) {
            return message.reply(this.Embed.generic('No member mentioned and/or an invalid ❄️ was used!'));
        } else if(opponent.user.bot) {
            return message.reply(this.Embed.fail('Can\'t play against a bot!'));
        }
        
        let turn = message.author.id;
        games.push(message.guild.id);
        const game = gen();

        const m = await message.reply(this.Embed.success(`
        ${message.member} vs. ${opponent}

        ${game.map(a => a.length === 0 ? '0' : `${a.join(' ')} (${a.length})`).join('\n')}
        `));
        if(!m) {
            games.splice(games.indexOf(message.guild.id), 1);
            return;
        }

        const f = (msg: Message) => 
            ([opponent.id, message.author.id].includes(msg.author.id)) &&
            turn === msg.author.id && 
            msg.content.length === 3 && // 1 2 | 2 3 | 3 4
            msg.content.split(/\s+/g).every(i => isValidNumber(Number(i)));

        const collector = message.channel.createMessageCollector(f, { time: 120000 });
        collector.on('collect', async (msg: Message) => {
            if(!m) {
                games.splice(games.indexOf(message.guild.id), 1);
                collector.stop();
            }

            const [row, idx] = msg.content.split(/\s+/g).map(s => Number(s));
            if(game[row-1].length === 0) { // nothing to remove from the row
                if(m.embeds[0].description.includes('Row is empty already!')) { 
                    // let's not edit the message if there's nothing to add
                    return;
                } else { 
                    // inform the user that they can't remove anything from the row
                    return m.edit(this.Embed.success(`
                    ${message.member} vs. ${opponent}
                    Row is empty already!
                    ${game.map(a => a.length === 0 ? '0' : `${a.join(' ')} (${a.length})`).join(' ')}
                    `));
                }
            }

            if(game[row-1].length < idx) {
                if(m.embeds[0].description.includes('I can')) { 
                    return;
                } else { 
                    // inform the user that they can't remove anything from the row
                    return m.edit(this.Embed.success(`
                    ${message.member} vs. ${opponent}
                    I can't remove ${idx} spots...
                    ${game.map(a => a.length === 0 ? '0' : `${a.join(' ')} (${a.length})`).join('\n')}
                    `));
                }
            }

            game[row-1].splice(0, idx); // remove idx items from array
            const sum = game.flat().reduce((a, b) => a + b.length, 0);
            if(sum <= 1) {
                collector.stop();
                games.splice(games.indexOf(message.guild.id), 1);
                return m.edit(this.Embed.success(`
                ${turn === message.author.id ? message.member : opponent} wins!

                ${game.map(a => a.length === 0 ? '0' : `${a.join(' ')} (${a.length})`).join('\n')}
                `));
            }

            turn = turn === message.author.id ? opponent.id : message.author.id;
            return m.edit(this.Embed.success(`
            ${message.member} vs. ${opponent}

            ${game.map(a => a.length === 0 ? '0' : `${a.join(' ')} (${a.length})`).join('\n')}
            `));
        });
    }
}