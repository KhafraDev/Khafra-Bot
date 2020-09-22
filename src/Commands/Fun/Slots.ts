import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';

const fruits = ['🍎', '🍊','🍌', '🍉', '🍇', '🍑'];

const shuffle = () => {
    const a = Array.from(fruits); // clone array
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const delay = () => new Promise(r => setTimeout(r, 500));

export default class extends Command {
    constructor() {
        super(
            [
                'Slots.',
                ''
            ], 
            [ /* No extra perms needed */ ],
            {
                name: 'slots',
                folder: 'Fun',
                aliases: [ 'slot' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const [a, b, c]: string[][] = [ shuffle(), shuffle(), shuffle() ];
        const embed = this.Embed.success(`
        ${a[0]} | ${b[0]} | ${c[0]}
        ${a[1]} | ${b[1]} | ${c[1]}
        ${a[2]} | ${b[2]} | ${c[2]}
        `);

        const sent = await message.channel.send(embed);
        if(!sent) {
            return;
        }
        
        await delay();
        for(let i = 2; i < 5; i++) {
            const embed = this.Embed.success(`
            ${a[i-1]} | ${b[i-1]} | ${c[i-1]}
            ${a[i]} | ${b[i]} | ${c[i]}
            ${a[i+1]} | ${b[i+1]} | ${c[i+1]}
            `);
            await sent.edit(embed);
            await delay();
        }
    }
}