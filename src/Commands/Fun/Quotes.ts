import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { promisify } from 'util';
import { randomInt } from 'crypto';
import quotes from '../../../assets/quotes.json';

const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);

export default class extends Command {
    constructor() {
        super(
            [
                'Get an inspirational quote.',
                ''
            ], 
            {
                name: 'quotes',
                folder: 'Fun',
                aliases: [ 'quote' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const quote = quotes[await rand(quotes.length)];
        return message.reply(this.Embed.success(`
        \`\`${quote.text}\`\`${quote.author ? `\n- ${quote.author}` : ''}
        `));
    }
}